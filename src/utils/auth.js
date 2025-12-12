import bcrypt from "bcrypt";
import crypto from "crypto";
import config from "../config/index.js";

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS || 12);

/**
 * Hash a plain text password using bcrypt.
 * @param {string} plainPassword
 * @returns {Promise<string>} bcrypt hash
 */
export async function hashPassword(plainPassword) {
  if (!plainPassword || typeof plainPassword !== "string") {
    throw new Error("Password must be a non-empty string");
  }
  const hash = await bcrypt.hash(plainPassword, SALT_ROUNDS);
  return hash;
}

/**
 * Compare a plain password with a bcrypt hash.
 * @param {string} plainPassword
 * @param {string} hash
 * @returns {Promise<boolean>}
 */
export async function comparePassword(plainPassword, hash) {
  if (!plainPassword || !hash) return false;
  return bcrypt.compare(plainPassword, hash);
}

/**
 * Generate a secure random refresh token (opaque string) to send to clients.
 * This is NOT the hashed form — you must hash before storing in DB.
 * Output is URL-safe base64 (no +/= characters).
 *
 * @param {number} [size=48] - number of random bytes (48 → 64 chars base64url)
 * @returns {string} token
 */
export function generateRefreshToken(size = 48) {
  const buf = crypto.randomBytes(size);
  // base64url: replace +/ with -_, remove padding '='
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Hash a token for safe storage (use SHA-256 hex).
 * We hash refresh tokens so we never store raw tokens in DB.
 *
 * @param {string} token
 * @returns {string} hex hash
 */
export function hashToken(token) {
  if (!token || typeof token !== "string")
    throw new Error("Token must be a non-empty string");
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Verify whether a raw token corresponds to a stored hashed token.
 * @param {string} token - raw token received
 * @param {string} storedHash - stored hex hash
 * @returns {boolean}
 */
export function verifyHashedToken(token, storedHash) {
  if (!token || !storedHash) return false;
  const h = hashToken(token);
  // Use constant-time comparison to avoid timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(h, "hex"),
    Buffer.from(storedHash, "hex")
  );
}
