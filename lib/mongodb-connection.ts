/**
 * Get MongoDB connection string with proper handling of malformed DATABASE_URL
 * Fixes the issue where DATABASE_URL might have duplicate key names like:
 * DATABASE_URL=DATABASE_URL=mongodb://...
 */

/** True only when the app runs inside Docker (Compose sets DOCKER=true). Not NODE_ENV. */
function isRunningInDocker(): boolean {
  return process.env.DOCKER === 'true';
}

/**
 * `mongodb` is the Compose service name and only resolves on the Docker network.
 * If DATABASE_URL was copied from docker-compose but Next runs on the host, connect to localhost.
 */
function rewriteDockerServiceHostForLocalDev(uri: string): string {
  if (isRunningInDocker()) return uri;
  try {
    const u = new URL(uri);
    if (u.hostname === 'mongodb') {
      u.hostname = '127.0.0.1';
      return u.href;
    }
  } catch {
    /* ignore */
  }
  return uri;
}

/** Only when `SKIP_DB_ENV_VALIDATION=1` (e.g. `next build` in Docker without `.env` in context). Never use at runtime. */
const BUILD_PLACEHOLDER_URI =
  'mongodb://buildtime:buildtime@127.0.0.1:27017/buildtime?authSource=admin';

function allowMissingDbEnvForBuild(): boolean {
  const v = process.env.SKIP_DB_ENV_VALIDATION;
  return v === '1' || v === 'true';
}

export function getMongoDbUri(): string {
  // Fix malformed DATABASE_URL that might have duplicate key names
  let databaseUrl = process.env.DATABASE_URL;

  // If DATABASE_URL is provided, use it
  if (databaseUrl) {
    if (databaseUrl.startsWith('DATABASE_URL=')) {
      databaseUrl = databaseUrl.replace('DATABASE_URL=', '');
    }
    return rewriteDockerServiceHostForLocalDev(databaseUrl);
  }

  // Build URI from individual environment variables (no hardcoded passwords)
  const username = process.env.MONGO_USERNAME || 'mjcarros';
  const password = process.env.MONGO_PASSWORD;
  if (!password) {
    if (allowMissingDbEnvForBuild()) {
      return BUILD_PLACEHOLDER_URI;
    }
    throw new Error(
      'Missing database credentials: set DATABASE_URL or MONGO_PASSWORD (and related MONGO_* vars) in the environment.'
    );
  }
  const rawHost = process.env.MONGO_HOST || (isRunningInDocker() ? 'mongodb' : 'localhost');
  const host =
    !isRunningInDocker() && rawHost === 'mongodb' ? '127.0.0.1' : rawHost;
  const port = process.env.MONGO_PORT || '27017';
  const database = process.env.MONGO_DATABASE || 'mjcarros';
  const authSource = process.env.MONGO_AUTH_SOURCE || 'mjcarros';
  return `mongodb://${username}:${password}@${host}:${port}/${database}?authSource=${authSource}`;
}

export function getMongoDbName(): string {
  if (process.env.MONGO_DATABASE) {
    return process.env.MONGO_DATABASE;
  }
  let databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl && databaseUrl.startsWith('DATABASE_URL=')) {
    databaseUrl = databaseUrl.replace('DATABASE_URL=', '');
  }
  if (databaseUrl) {
    try {
      const url = new URL(databaseUrl);
      const pathname = url.pathname || '';
      const db = pathname.replace(/^\//, '').split('/')[0] || '';
      if (db) return db;
    } catch {
      /* ignore */
    }
  }
  if (allowMissingDbEnvForBuild()) {
    try {
      const uri = getMongoDbUri();
      const u = new URL(uri);
      const seg = u.pathname?.replace(/^\//, '').split('/')[0];
      if (seg) return seg;
    } catch {
      /* ignore */
    }
    return 'buildtime';
  }
  throw new Error(
    'Missing MONGO_DATABASE or DATABASE_URL with a database path in the environment.'
  );
}

/** Which DB name the app uses (from DATABASE_URL path or MONGO_DATABASE). Safe to log. */
export function getMongoConnectionSummary(): { databaseName: string; host: string } {
  const uri = getMongoDbUri();
  let host = 'unknown';
  try {
    host = new URL(uri).hostname;
  } catch {
    /* ignore */
  }
  return { databaseName: getMongoDbName(), host };
}
