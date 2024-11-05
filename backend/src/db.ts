// backend/src/config/db.ts or wherever your pool configuration is
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'transcription'
});

// Test the connection
pool.connect((err, client, release) => {
    if (err) {
        return console.error('Error acquiring client:', err.stack);
    }
    client!.query('SELECT NOW()', (err, result) => {
        release();
        if (err) {
            return console.error('Error executing query:', err.stack);
        }
        console.log('Database connected successfully');
    });
});

export default pool;