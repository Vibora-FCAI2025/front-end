import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// JWT Token utilities
export interface JWTPayload {
  exp?: number;
  iat?: number;
  sub?: string;
  [key: string]: any;
}

/**
 * Decode JWT token without verification (client-side only)
 * @param token JWT token string
 * @returns Decoded payload or null if invalid
 */
export function decodeJWT(token: string): JWTPayload | null {
  try {
    // Remove Bearer prefix if present
    const cleanToken = token.replace(/^Bearer\s+/i, '');
    
    // Split token into parts
    const parts = cleanToken.split('.');
    if (parts.length !== 3) {
      return null;
    }

    // Decode payload (second part)
    const payload = parts[1];
    // Add padding if needed for base64 decoding
    const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);
    
    const decodedPayload = atob(paddedPayload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decodedPayload);
  } catch (error) {
    console.error('Error decoding JWT token:', error);
    return null;
  }
}

/**
 * Check if JWT token is expired
 * @param token JWT token string
 * @returns true if token is expired or invalid, false if still valid
 */
export function isTokenExpired(token: string | null): boolean {
  if (!token) {
    return true;
  }

  const payload = decodeJWT(token);
  if (!payload || !payload.exp) {
    return true;
  }

  // Convert expiration time from seconds to milliseconds and compare with current time
  const expirationTime = payload.exp * 1000;
  const currentTime = Date.now();
  
  return currentTime >= expirationTime;
}

/**
 * Get time until token expires in milliseconds
 * @param token JWT token string
 * @returns milliseconds until expiration, or 0 if expired/invalid
 */
export function getTimeUntilExpiration(token: string | null): number {
  if (!token) {
    return 0;
  }

  const payload = decodeJWT(token);
  if (!payload || !payload.exp) {
    return 0;
  }

  const expirationTime = payload.exp * 1000;
  const currentTime = Date.now();
  
  return Math.max(0, expirationTime - currentTime);
}
