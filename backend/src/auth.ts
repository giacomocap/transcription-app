import passport from 'passport';
import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';
import { Request, Response, NextFunction } from 'express';
import prisma from './db';
import { v4 as uuidv4 } from 'uuid';
import { UserData, AuthenticatedRequest } from './types/auth';

const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
// Configure Google OAuth strategy
passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID || '',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
            callbackURL: frontendUrl + '/api/auth/google/callback',
        },
        async (accessToken: string, refreshToken: string, profile: Profile, done: any) => {
            try {
                // Check if user exists
                const existingUser = await prisma.users.findUnique({
                    where: { google_id: profile.id }
                });

                if (existingUser) {
                    // Update existing user
                    const updatedUser = await prisma.users.update({
                        where: { google_id: profile.id },
                        data: {
                            display_name: profile.displayName,
                            profile_picture: profile.photos?.[0]?.value,
                            updated_at: new Date()
                        }
                    });
                    return done(null, updatedUser);
                }

                // Create new user
                const newUser = await prisma.users.create({
                    data: {
                        id: uuidv4(),
                        google_id: profile.id,
                        email: profile.emails?.[0]?.value!,
                        display_name: profile.displayName,
                        profile_picture: profile.photos?.[0]?.value
                    }
                });

                return done(null, newUser);
            } catch (error) {
                return done(error as Error);
            }
        }
    )
);

// Serialize user for the session
passport.serializeUser((user: UserData, done) => {
    done(null, user.id);
});

// Deserialize user from the session
passport.deserializeUser(async (id: string, done) => {
    try {
        const user = await prisma.users.findUnique({ where: { id } });
        done(null, user as any);
    } catch (error) {
        done(error);
    }
});

// Middleware to check if user is authenticated
export const isAuthenticated = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({ error: 'Unauthorized' });
};

export const checkAdmin = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    if (req.user?.email !== process.env.ADMIN_EMAIL) {
        res.status(403).json({ error: 'Unauthorized' });
    }
    next();
};

// Middleware to check if user owns the resource
export const isResourceOwner = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    const checkOwnership = async () => {
        try {
            const jobId = req.params.id;
            const userId = req.user?.id;

            const job = await prisma.jobs.findUnique({
                where: { id: jobId },
                select: { user_id: true }
            });

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

// Auth routes
export const configureAuthRoutes = (router: any) => {
    router.get(
        '/auth/google',
        passport.authenticate('google', {
            scope: ['profile', 'email'],
        })
    );

    router.get(
        '/auth/google/callback',
        passport.authenticate('google', {
            failureRedirect: `${frontendUrl}/login`,
            successRedirect: frontendUrl,
        })
    );

    router.get('/auth/user', (req: AuthenticatedRequest, res: Response) => {
        if (req.user) {
            res.json(req.user);
        } else {
            res.status(401).json({ error: 'Not authenticated' });
        }
    });

    router.post('/auth/logout', (req: Request, res: Response) => {
        req.logout(() => {
            res.json({ success: true });
        });
    });
};

export default passport;