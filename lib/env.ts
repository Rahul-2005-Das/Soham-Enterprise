/**
 * Central environment-variable access.
 *
 * Security rule: secrets that protect authentication (JWT signing, session
 * tokens, etc.) must NEVER have a hardcoded fallback baked into source code.
 * If a required secret is missing, the server should fail to start rather
 * than silently run with a publicly-known default value.
 */

export function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    throw new Error(
      `[env] Missing required environment variable "${name}". ` +
        `Set it in your .env file (see .env.example) before starting the server.`
    );
  }
  return value;
}

export function getOptionalEnv(name: string, fallback: string): string {
  const value = process.env[name];
  return value && value.trim().length > 0 ? value : fallback;
}
