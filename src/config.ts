import dotenv from 'dotenv';
dotenv.config();

export const config = {
  PORT: process.env.PORT || 3000,
  REDIS_URL: process.env.REDIS_URL,
  REDIS_HOST: process.env.REDIS_HOST || 'localhost',
  REDIS_PORT: parseInt(process.env.REDIS_PORT || '6379'),
  DATABASE_URL: process.env.DATABASE_URL,
};

console.log('--- Environment Check ---');
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`PORT: ${config.PORT}`);
console.log(`DATABASE_URL present: ${!!config.DATABASE_URL}`);
console.log(`REDIS_URL present: ${!!config.REDIS_URL}`);
if (config.REDIS_URL) {
    console.log(`REDIS_URL (masked): ${config.REDIS_URL.substring(0, 15)}...`);
} else {
    console.log(`REDIS_HOST: ${config.REDIS_HOST}`);
    console.log(`REDIS_PORT: ${config.REDIS_PORT}`);
}
console.log('---------------------------');
