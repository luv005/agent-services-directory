"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getClient = exports.query = void 0;
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Support Railway's DATABASE_URL format
const databaseUrl = process.env.DATABASE_URL;
let poolConfig;
if (databaseUrl) {
    // Railway provides DATABASE_URL
    poolConfig = {
        connectionString: databaseUrl,
        ssl: {
            rejectUnauthorized: false // Required for Railway Postgres
        }
    };
}
else {
    // Local development config
    poolConfig = {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'agent_services',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
    };
}
const pool = new pg_1.Pool({
    ...poolConfig,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});
const query = async (text, params) => {
    const start = Date.now();
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Query executed:', { text: text.substring(0, 50), duration, rows: result.rowCount });
    return result;
};
exports.query = query;
const getClient = () => pool.connect();
exports.getClient = getClient;
exports.default = pool;
//# sourceMappingURL=index.js.map