// src/config/example.ts

// Database configuration example
export const databaseConfig = {
    host: process.env.DB_HOST as string || 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    user: process.env.DB_USER as string || 'admin',
    password: process.env.DB_PASSWORD as string || 'password',
    database: process.env.DB_NAME as string || 'my_database',
};
