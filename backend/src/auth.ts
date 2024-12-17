import passport from 'passport';
import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';
import { Request, Response, NextFunction } from 'express';
import pool from './db';
import { v4 as uuidv4 } from 'uuid';
import { UserData, AuthenticatedRequest } from './types/auth';

// Configure Google OAuth strategy
passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID || '',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
            callbackURL: '/api/auth/google/callback',
        },
        async (accessToken: string, refreshToken: string, profile: Profile, done: any) => {
            try {
                // Check if user exists
                const existingUserResult = await pool.query(
                    'SELECT * FROM users WHERE google_id = $1',
                    [profile.id]
                );

                if (existingUserResult.rows[0]) {
                    // Update existing user
                    const updatedUser = await pool.query(
                        `UPDATE users
                         SET display_name = $1,
                             profile_picture = $2,
                             updated_at = NOW()
                         WHERE google_id = $3
                         RETURNING *`,
                        [
                            profile.displayName,
                            profile.photos?.[0]?.value,
                            profile.id,
                        ]
                    );
                    return done(null, updatedUser.rows[0]);
                }

                // Create new user
                const newUser = await pool.query(
                    `INSERT INTO users (
                        id,
                        google_id,
                        email,
                        display_name,
                        profile_picture
                    ) VALUES ($1, $2, $3, $4, $5)
                    RETURNING *`,
                    [
                        uuidv4(),
                        profile.id,
                        profile.emails?.[0]?.value,
                        profile.displayName,
                        profile.photos?.[0]?.value,
                    ]
                );

                return done(null, newUser.rows[0]);
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
        const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
        done(null, result.rows[0]);
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

            const result = await pool.query(
                'SELECT user_id FROM jobs WHERE id = $1',
                [jobId]
            );

            if (!result.rows[0]) {
                res.status(404).json({ error: 'Job not found' });
                return;
            }

            if (result.rows[0].user_id !== userId) {
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
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
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