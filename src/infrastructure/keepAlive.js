/**
 * keepAlive.js
 *
 * Prevents the Render free-tier server from spinning down by sending an HTTP
 * GET request to its own /health endpoint every 10 minutes.
 *
 * Render spins down free services after ~15 minutes of inactivity.
 * This script runs entirely inside the same Node process, so no extra
 * service or cron job is needed.
 */

const https = require('https');
const http = require('http');

const PING_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Derives the public URL to ping.
 *
 * Priority order:
 *   1. RENDER_EXTERNAL_URL  — set automatically by Render for every web service
 *   2. SELF_PING_URL        — optional override you can add to .env
 *   3. null                 — keep-alive is skipped (e.g. local dev)
 */
function resolveTargetUrl() {
  const url =
    process.env.RENDER_EXTERNAL_URL ||
    process.env.SELF_PING_URL ||
    null;

  if (!url) return null;

  // Ensure the path is /health
  return url.replace(/\/+$/, '') + '/health';
}

/**
 * Fires a single GET request and logs the outcome.
 * Errors are caught and logged; they never crash the server.
 */
function ping(targetUrl) {
  const driver = targetUrl.startsWith('https') ? https : http;

  const req = driver.get(targetUrl, (res) => {
    console.log(
      `[keep-alive] Ping OK — ${targetUrl} responded ${res.statusCode} at ${new Date().toISOString()}`
    );
    // Consume response body so the socket is released cleanly
    res.resume();
  });

  req.on('error', (err) => {
    console.warn(`[keep-alive] Ping failed — ${err.message}`);
  });

  req.setTimeout(10_000, () => {
    console.warn('[keep-alive] Ping timed out (10 s)');
    req.destroy();
  });
}

/**
 * Starts the keep-alive interval.
 * Call this once after the HTTP server is listening.
 *
 * @returns {NodeJS.Timeout | null} The interval handle (or null if skipped).
 */
function startKeepAlive() {
  const targetUrl = resolveTargetUrl();

  if (!targetUrl) {
    console.log(
      '[keep-alive] No RENDER_EXTERNAL_URL or SELF_PING_URL found — self-ping disabled (local dev mode).'
    );
    return null;
  }

  console.log(`[keep-alive] Self-ping enabled → ${targetUrl} every 10 minutes.`);

  // Ping once immediately after startup, then on the regular interval
  ping(targetUrl);
  const handle = setInterval(() => ping(targetUrl), PING_INTERVAL_MS);

  // Allow Node to exit normally even if the interval is still pending
  handle.unref();

  return handle;
}

module.exports = { startKeepAlive };
