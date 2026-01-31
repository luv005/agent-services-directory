import { Pool, QueryResult } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Support Railway's DATABASE_URL format
const databaseUrl = process.env.DATABASE_URL;

let poolConfig: any;

if (databaseUrl) {
  // Railway provides DATABASE_URL
  poolConfig = {
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false // Required for Railway Postgres
    }
  };
} else {
  // Local development config
  poolConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'agent_services',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  };
}

const pool = new Pool({
  ...poolConfig,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export const query = async (text: string, params?: any[]): Promise<QueryResult> => {
  const start = Date.now();
  const result = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log('Query executed:', { text: text.substring(0, 50), duration, rows: result.rowCount });
  return result;
};

export const getClient = () => pool.connect();

export default pool;
