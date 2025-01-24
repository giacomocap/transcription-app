import { supabaseAdmin } from './utils/supabase';
import { Response, NextFunction } from 'express'
import { AuthenticatedRequest } from './types/auth';


export const isAuthenticated = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    const checkAuthenticated = async () => {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        try {
            const { data: user, error } = await supabaseAdmin.auth.getUser(token);
            if (error) throw error;

            req.user = user.user;
            next();
        } catch (error) {
            res.status(401).json({ error: 'Invalid token' });
        }
    }
    checkAuthenticated();
};

export const isAdmin = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    if (req.user?.email !== process.env.ADMIN_EMAIL) {
        res.status(403).json({ error: 'Unauthorized' })
        return
    }
    next()
}

// Middleware to check if user owns the resource
export const isResourceOwner = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    const checkOwnership = async () => {
        const token = req.headers.authorization?.split(' ')[1];
        if (token && !req.user) {
            try {
                const { data: user, error } = await supabaseAdmin.auth.getUser(token);
                if (error) throw error;

                req.user = user.user;
                next();
            } catch (error) {
                res.status(401).json({ error: 'Invalid token' });
            }
        }

        const jobId = req.params.id;
        const userId = req.user?.id;
        try {

            const { data: job } = await supabaseAdmin
                .from('jobs')
                .select('user_id')
                .eq('id', jobId)
                .single();

            if (!job) {
                res.status(404).json({ error: 'Job not found' });
                return;
            }

            if (job.user_id !== userId) {
                res.status(403).json({ error: 'Forbidden' });
                return;
            }

            next();
        } catch (error) {
            res.status(500).json({ error: 'Server error' });
        }
    };

    checkOwnership();
};

// Middleware to check if user has access to job (owner or shared)
export const hasJobAccess = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const checkJobAccess = async () => {
        const authToken = req.headers.authorization?.split(' ')[1];
        if (authToken && !req.user) {
            try {
                const { data: user, error } = await supabaseAdmin.auth.getUser(authToken);
                if (error) throw error;

                req.user = user.user;
            } catch (error) {
                res.status(401).json({ error: 'Invalid token' });
            }
        }
        const jobId = req.params.id;
        const userId = req.user?.id;
        const token = req.query.token as string | undefined;

        try {

            const { data: job } = await supabaseAdmin
                .from('jobs')
                .select(`id,
                    user_id,
                    job_shares!left(*)`) // Use !left for left outer join
                .eq('id', jobId)
                .single();

            if (!job) {
                return res.status(404).json({ error: 'Job not found' });
            }

            // Allow access if user is owner
            if (job.user_id === userId) {
                return next();
            }

            // Check for valid public share token
            if (token) {
                const publicShare = job.job_shares.find(share =>
                    share.type === 'public' &&
                    share.token === token
                );
                if (publicShare) {
                    return next();
                }
            }

            // Check for email-based sharing
            if (userId) {
                const emailShare = job.job_shares.find(share =>
                    share.type === 'email' &&
                    share.email === req.user?.email &&
                    share.status === 'accepted'
                );
                if (emailShare) {
                    return next();
                }
            }

            return res.status(403).json({ error: 'Access denied' });
        } catch (error) {
            console.error('Error checking job access:', error);
            return res.status(500).json({ error: 'Failed to verify access' });
        }
    }
    checkJobAccess();
};