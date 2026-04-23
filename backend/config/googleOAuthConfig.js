const fs = require('fs');
const path = require('path');

function readJson(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
}

function resolveMaybeRelative(p, baseDir) {
  if (!p) return null;
  if (path.isAbsolute(p)) return p;
  return path.resolve(baseDir, p);
}

function isPlaceholder(value) {
  if (!value) return true;
  const v = String(value).trim();
  if (!v) return true;
  return (
    v.startsWith('your_') ||
    v.includes('your_google_client_id') ||
    v.includes('your_google_client_secret') ||
    v.includes('example') ||
    v === 'changeme'
  );
}

/**
 * Loads Google OAuth "web" client credentials.
 *
 * Priority:
 * 1) GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_REDIRECT_URL
 * 2) GOOGLE_OAUTH_CLIENT_SECRET_FILE (a Google OAuth client JSON)
 *
 * This intentionally does NOT write secrets back to disk.
 */
function loadGoogleOAuthConfig(env = process.env, opts = {}) {
  const baseDir = opts.baseDir || process.cwd();

  let clientId = isPlaceholder(env.GOOGLE_CLIENT_ID) ? '' : env.GOOGLE_CLIENT_ID;
  let clientSecret = isPlaceholder(env.GOOGLE_CLIENT_SECRET)
    ? ''
    : env.GOOGLE_CLIENT_SECRET;
  let redirectUrl = isPlaceholder(env.GOOGLE_REDIRECT_URL)
    ? ''
    : env.GOOGLE_REDIRECT_URL;

  const clientSecretFile =
    env.GOOGLE_OAUTH_CLIENT_SECRET_FILE || env.GOOGLE_CLIENT_SECRET_FILE || '';

  if ((!clientId || !clientSecret || !redirectUrl) && clientSecretFile) {
    const resolved = resolveMaybeRelative(clientSecretFile, baseDir);
    const json = readJson(resolved);

    const web = json.web || {};
    clientId = clientId || web.client_id || '';
    clientSecret = clientSecret || web.client_secret || '';
    redirectUrl =
      redirectUrl ||
      (Array.isArray(web.redirect_uris) ? web.redirect_uris[0] : '') ||
      '';
  }

  if (!redirectUrl) {
    redirectUrl = 'http://localhost:3001/api/external/google/callback';
  }

  return { clientId, clientSecret, redirectUrl };
}

module.exports = { loadGoogleOAuthConfig };

