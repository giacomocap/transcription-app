import crypto from 'crypto';

export function generateURLSafeToken(length: number = 32): string {
    return crypto.randomBytes(length)
      .toString('base64')
      .replace(/[+/=]/g, '')  // Remove non-URL safe characters
      .slice(0, length);
  }