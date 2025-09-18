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
  
  // If DATABASE_URL is provided, use it
  if (databaseUrl) {
    return databaseUrl;
  }

  // Build URI from individual environment variables for better security
  const username = process.env.MONGO_USERNAME || 'mjcarros';
  const password = process.env.MONGO_PASSWORD || '786Password';
  const host = process.env.MONGO_HOST || (isDocker ? 'mongodb' : 'localhost');
  const port = process.env.MONGO_PORT || '27017';
  const database = process.env.MONGO_DATABASE || 'mjcarros';
  const authSource = process.env.MONGO_AUTH_SOURCE || 'mjcarros';
  
  return `mongodb://${username}:${password}@${host}:${port}/${database}?authSource=${authSource}`;
}
