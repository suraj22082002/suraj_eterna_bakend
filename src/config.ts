import dotenv from 'dotenv';
dotenv.config();

export const config = {
  PORT: process.env.PORT || 3000,
  REDIS_URL: process.env.REDIS_URL,
  REDIS_HOST: process.env.REDIS_HOST || 'localhost',
  REDIS_PORT: parseInt(process.env.REDIS_PORT || '6379'),
  DATABASE_URL: process.env.DATABASE_URL,
};

console.log('--- Configuration Loaded ---');
console.log(`Port: ${config.PORT}`);
console.log(`Redis Mode: ${config.REDIS_URL ? 'URL' : 'Host/Port'}`);
if (!config.REDIS_URL) {
    console.log(`Redis Host: ${config.REDIS_HOST}:${config.REDIS_PORT}`);
}
console.log('---------------------------');
