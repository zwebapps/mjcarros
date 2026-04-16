/**
 * Shared MongoDB URI resolution for Node scripts (matches lib/mongodb-connection.ts behavior).
 * Never embed credentials in source; use DATABASE_URL or MONGO_PASSWORD (+ related MONGO_*).
 */
function getMongoDbUri() {
  let databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl && databaseUrl.startsWith('DATABASE_URL=')) {
    databaseUrl = databaseUrl.replace('DATABASE_URL=', '');
  }
  if (databaseUrl) {
    return databaseUrl;
  }

  const username = process.env.MONGO_USERNAME || 'mjcarros';
  const password = process.env.MONGO_PASSWORD;
  if (!password) {
    throw new Error(
      'Missing database credentials: set DATABASE_URL or MONGO_PASSWORD (and MONGO_* host/db) in the environment.'
    );
  }

  const isDocker = process.env.NODE_ENV === 'production' || process.env.DOCKER === 'true';
  const rawHost = process.env.MONGO_HOST || (isDocker ? 'mongodb' : 'localhost');
  const host = !isDocker && rawHost === 'mongodb' ? '127.0.0.1' : rawHost;
  const port = process.env.MONGO_PORT || '27017';
  const database = process.env.MONGO_DATABASE || 'mjcarros';
  const authSource = process.env.MONGO_AUTH_SOURCE || database;

  const user = encodeURIComponent(username);
  const pass = encodeURIComponent(password);
  return `mongodb://${user}:${pass}@${host}:${port}/${database}?authSource=${authSource}`;
}

module.exports = { getMongoDbUri };
