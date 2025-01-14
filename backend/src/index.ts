// backend/src/index.ts  
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { router } from './routes-prisma';
import initializeDatabase from './init_db';
import swaggerUi from 'swagger-ui-express';
import swaggerSpecs from './swaggerConfig';
import path from 'path';
import session from 'express-session';
import passport from './auth';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Initialize Passport and restore authentication state from session
app.use(passport.initialize());
app.use(passport.session());

app.use('/api', router);
app.use('/api/uploads', express.static(path.join(__dirname, '..', 'uploads')));

if (swaggerSpecs && Object.keys(swaggerSpecs).length > 0)
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

initializeDatabase().then(() => {
    console.log('Database initialized');
    // Start your server here

    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
        console.log(`Swagger UI available at http://localhost:${PORT}/api-docs`);
    });

}).catch(error => {
    console.error('Failed to initialize database:', error);
    process.exit(1);
});
