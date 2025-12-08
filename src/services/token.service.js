import jwt from "jsonwebtoken";
import config from "../config/index.js";
import { randomUUID } from "crypto";

const ACCESS_SECRET = config.jwt.accessSecret;
const ACCESS_EXPIRES = config.jwt.accessExpiry; // e.g., '15m'

export function signAccessToken(payload = {}, opts = {}) {
  const jwtId = randomUUID();
  const token = jwt.sign({ ...payload }, ACCESS_SECRET, {
    expiresIn: ACCESS_EXPIRES,
    jwtid: jwtId,
    ...opts,
  });
  return token;
}

export function verifyAccessToken(token) {
  try {
    return jwt.verify(token, ACCESS_SECRET);
  } catch (err) {
    throw err;
  }
}
