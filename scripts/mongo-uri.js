/**
 * Shared MongoDB URI resolution for Node scripts (matches lib/mongodb-connection.ts behavior).
 * Never embed credentials in source; use DATABASE_URL or MONGO_PASSWORD (+ related MONGO_*).
 */
function buildDockerUriFromParts() {
  const password = process.env.MONGO_PASSWORD;
  const database = process.env.MONGO_DATABASE;
  if (!password || !database || !String(database).trim()) {
    return null;
  }
  const username = process.env.MONGO_USERNAME || 'mjcarros';
  const rawHost = process.env.MONGO_HOST || 'mongodb';
  const isDocker = process.env.NODE_ENV === 'production' || process.env.DOCKER === 'true';
  const host = !isDocker && rawHost === 'mongodb' ? '127.0.0.1' : rawHost;
  const port = process.env.MONGO_PORT || '27017';
  const authSource = process.env.MONGO_AUTH_SOURCE || database;
  const user = encodeURIComponent(username);
  const pass = encodeURIComponent(password);
  return `mongodb://${user}:${pass}@${host}:${port}/${encodeURIComponent(database)}?authSource=${encodeURIComponent(authSource)}`;
}

function getMongoDbUri() {
  // Match mongodb-connection.ts: in Docker prefer MONGO_* (encoded); .env DATABASE_URL often wrong host / bad encoding.
  if (process.env.DOCKER === 'true') {
    const built = buildDockerUriFromParts();
    if (built) {
      return built;
    }
  }

  let databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl && databaseUrl.startsWith('DATABASE_URL=')) {
    databaseUrl = databaseUrl.replace('DATABASE_URL=', '');
  }
  if (databaseUrl) {
    return databaseUrl;
  }

  const username = process.env.MONGO_USERNAME;
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
  const database = process.env.MONGO_DATABASE;
  if (!database || !String(database).trim()) {
    throw new Error(
      'Missing MONGO_DATABASE: set it in the environment when DATABASE_URL is not set.'
    );
  }
  const authSource = process.env.MONGO_AUTH_SOURCE || database;

  const user = encodeURIComponent(username || '');
  const pass = encodeURIComponent(password);
  return `mongodb://${user}:${pass}@${host}:${port}/${encodeURIComponent(database)}?authSource=${encodeURIComponent(authSource)}`;
}

module.exports = { getMongoDbUri };
