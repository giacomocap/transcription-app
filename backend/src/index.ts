// backend/src/index.ts  
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { router } from './routes';
import initializeDatabase from './init_db';
import swaggerUi from 'swagger-ui-express';
import swaggerSpecs from './swaggerConfig';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/api', router);
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