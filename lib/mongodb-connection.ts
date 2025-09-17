/**
 * Get MongoDB connection string with proper handling of malformed DATABASE_URL
 * Fixes the issue where DATABASE_URL might have duplicate key names like:
 * DATABASE_URL=DATABASE_URL=mongodb://...
 */
export function getMongoDbUri(): string {
  // Fix malformed DATABASE_URL that might have duplicate key names
  let databaseUrl = process.env.DATABASE_URL;
  console.log('databaseUrl>>>>', databaseUrl);
  if (databaseUrl && databaseUrl.startsWith('DATABASE_URL=')) {
    databaseUrl = databaseUrl.replace('DATABASE_URL=', '');
  }

  // Use different connection strings for Docker vs local development
  const isDocker = process.env.NODE_ENV === 'production' || process.env.DOCKER === 'true';
  
  return databaseUrl || 
    (isDocker 
      ? 'mongodb://mjcarros:786Password@mongodb:27017/mjcarros?authSource=mjcarros'
      : 'mongodb://mjcarros:786Password@localhost:27017/mjcarros?authSource=mjcarros'
    );
}
