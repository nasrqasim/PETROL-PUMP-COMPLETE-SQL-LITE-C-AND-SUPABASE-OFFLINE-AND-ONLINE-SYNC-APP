import crypto from "crypto";

// User Interfaces
export interface AuthUser {
  id: string;
  username: string;
  role: "superadmin" | "trial";
  name: string;
}

export interface TrialConfig {
  username: string;
  passwordHash: string;
  salt: string;
  activated: boolean;
  activationDate: string | null;
  expiryDate: string | null;
  isDisabled: boolean;
}

export interface SuperAdminConfig {
  id: string;
  username: string;
  passwordHash: string;
  salt: string;
  name: string;
}

// Cryptographic Password Hashing using Node.js crypto.scrypt
export function hashPassword(password: string, customSalt?: string): { hash: string; salt: string } {
  const salt = customSalt || crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return { hash, salt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  try {
    const derived = crypto.scryptSync(password, salt, 64).toString("hex");
    return crypto.timingSafeEqual(Buffer.from(derived, "hex"), Buffer.from(hash, "hex"));
  } catch (err) {
    return false;
  }
}

// JWT-like Secure HMAC-SHA256 Signed Token
const JWT_SECRET = process.env.AUTH_SECRET || "muslim-construction-secret-key-roonjha-2026-secure-transport";

export function signToken(payload: { userId: string; username: string; role: "superadmin" | "trial" }): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 7 * 24 * 60 * 60; // 7 days session validity
  const body = Buffer.from(JSON.stringify({ ...payload, iat: now, exp })).toString("base64url");
  const signature = crypto.createHmac("sha256", JWT_SECRET).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${signature}`;
}

export function verifyToken(token: string): { valid: boolean; payload?: any; error?: string } {
  if (!token || typeof token !== "string") {
    return { valid: false, error: "Missing token" };
  }
  const parts = token.split(".");
  if (parts.length !== 3) {
    return { valid: false, error: "Malformed token" };
  }
  const [header, body, signature] = parts;
  const expectedSignature = crypto.createHmac("sha256", JWT_SECRET).update(`${header}.${body}`).digest("base64url");
  
  if (signature !== expectedSignature) {
    return { valid: false, error: "Invalid signature" };
  }

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return { valid: false, error: "Token expired" };
    }
    return { valid: true, payload };
  } catch (err) {
    return { valid: false, error: "Invalid payload JSON" };
  }
}

// Global Auth State (Preserved across serverless invocations via global)
declare global {
  var __mc_auth_state: {
    superAdmin: SuperAdminConfig;
    trial: TrialConfig;
  } | undefined;
}

// Initialize Auth Store
if (!global.__mc_auth_state) {
  // Super Admin Credentials
  const superAdminId = process.env.SUPERADMIN_ID || "admin";
  const superAdminPassword = process.env.SUPERADMIN_PASSWORD || "Admin@Muslim2026!";
  const superAdminHashed = hashPassword(superAdminPassword);

  // Default Trial Credentials
  const trialUsername = process.env.TRIAL_USERNAME || "trial_user";
  const trialPassword = process.env.TRIAL_PASSWORD || "Trial@2026!";
  const trialHashed = hashPassword(trialPassword);

  // Default: activated for 15 days
  const now = new Date();
  const activationDate = now.toISOString();
  const expiryDate = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString();

  global.__mc_auth_state = {
    superAdmin: {
      id: "superadmin_01",
      username: superAdminId,
      passwordHash: superAdminHashed.hash,
      salt: superAdminHashed.salt,
      name: "Muslim Construction Super Admin",
    },
    trial: {
      username: trialUsername,
      passwordHash: trialHashed.hash,
      salt: trialHashed.salt,
      activated: true,
      activationDate,
      expiryDate,
      isDisabled: false,
    },
  };
}

export const authState = global.__mc_auth_state!;

// Trial Evaluation Logic
export function getTrialStatus(): {
  username: string;
  activated: boolean;
  activationDate: string | null;
  expiryDate: string | null;
  isExpired: boolean;
  isDisabled: boolean;
  remainingDays: number;
  remainingHours: number;
} {
  const trial = authState.trial;
  if (!trial.activated || !trial.expiryDate) {
    return {
      username: trial.username,
      activated: false,
      activationDate: null,
      expiryDate: null,
      isExpired: false,
      isDisabled: trial.isDisabled,
      remainingDays: 15,
      remainingHours: 360,
    };
  }

  const now = Date.now();
  const expiryTime = new Date(trial.expiryDate).getTime();
  const diffMs = expiryTime - now;
  const isExpired = diffMs <= 0 || trial.isDisabled;

  const remainingHours = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));
  const remainingDays = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

  return {
    username: trial.username,
    activated: trial.activated,
    activationDate: trial.activationDate,
    expiryDate: trial.expiryDate,
    isExpired,
    isDisabled: trial.isDisabled,
    remainingDays,
    remainingHours,
  };
}

// Super Admin Trial Controls
export function activateTrial(days: number = 15): void {
  const now = new Date();
  const expiry = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  authState.trial.activated = true;
  authState.trial.activationDate = now.toISOString();
  authState.trial.expiryDate = expiry.toISOString();
  authState.trial.isDisabled = false;
}

export function disableTrial(): void {
  authState.trial.isDisabled = true;
}

export function enableTrial(): void {
  authState.trial.isDisabled = false;
}

export function updateTrialCredentials(newUsername?: string, newPassword?: string): void {
  if (newUsername && newUsername.trim()) {
    authState.trial.username = newUsername.trim();
  }
  if (newPassword && newPassword.trim()) {
    const hashed = hashPassword(newPassword.trim());
    authState.trial.passwordHash = hashed.hash;
    authState.trial.salt = hashed.salt;
  }
}
