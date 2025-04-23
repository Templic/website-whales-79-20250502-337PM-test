/**
 * twoFactorAuth.ts
 * 
 * Provides utilities for two-factor authentication using TOTP.
 * This module handles generation and verification of one-time passwords,
 * management of secret keys, and QR code generation.
 */

import { authenticator } from '@otplib/preset-default';
import { randomBytes } from 'crypto';
import qrcode from 'qrcode';

// Configuration
const APP_NAME = 'Cosmic Music';
const BACKUP_CODE_LENGTH = 10;
const BACKUP_CODE_COUNT = 10;

/**
 * Generate a cryptographically secure secret key for TOTP
 */
export const generateSecret = (userIdentifier: string): string => {
  // Generate a secure random secret for the user
  const secret = authenticator.generateSecret();
  return secret;
};

/**
 * Generate backup codes for a user
 * @returns An array of backup codes
 */
export const generateBackupCodes = (): string[] => {
  const codes: string[] = [];
  
  // Generate the requested number of backup codes
  for (let i = 0; i < BACKUP_CODE_COUNT; i++) {
    // Generate random bytes and convert to a string
    const buffer = randomBytes(Math.ceil(BACKUP_CODE_LENGTH / 2));
    let code = buffer.toString('hex').slice(0, BACKUP_CODE_LENGTH).toUpperCase();
    
    // Format as XXXXX-XXXXX
    code = `${code.slice(0, 5)}-${code.slice(5)}`;
    codes.push(code);
  }
  
  return codes;
};

/**
 * Generate a TOTP URI for use in authenticator apps
 * @param username The username or email of the user
 * @param secret The secret key
 * @returns A URI that can be used to add to authenticator apps
 */
export const generateTotpUri = (username: string, secret: string): string => {
  return authenticator.keyuri(username, APP_NAME, secret);
};

/**
 * Generate a QR code for the TOTP URI
 * @param totpUri The TOTP URI
 * @returns A data URL containing the QR code image
 */
export const generateQrCode = async (totpUri: string): Promise<string> => {
  try {
    // Generate a QR code as a data URL
    const qrCodeDataUrl = await qrcode.toDataURL(totpUri);
    return qrCodeDataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
};

/**
 * Verify a TOTP token against a secret
 * @param token The token provided by the user
 * @param secret The secret key
 * @returns A boolean indicating whether the token is valid
 */
export const verifyToken = (token: string, secret: string): boolean => {
  try {
    // Check if the token is valid
    return authenticator.verify({ token, secret });
  } catch (error) {
    console.error('Error verifying token:', error);
    return false;
  }
};

/**
 * Verify a backup code
 * @param providedCode The backup code provided by the user
 * @param storedBackupCodes The array of backup codes stored for the user
 * @returns An object containing a success flag and the remaining backup codes
 */
export const verifyBackupCode = (
  providedCode: string,
  storedBackupCodes: string[] | null
): { success: boolean; remainingCodes: string[] } => {
  // Normalize the provided code
  const normalizedCode = providedCode.trim().toUpperCase();
  
  // Check if there are any stored backup codes
  if (!storedBackupCodes || storedBackupCodes.length === 0) {
    return { success: false, remainingCodes: [] };
  }
  
  // Check if the provided code exists in the stored backup codes
  const codeIndex = storedBackupCodes.findIndex(code => code === normalizedCode);
  
  if (codeIndex === -1) {
    return { success: false, remainingCodes: storedBackupCodes };
  }
  
  // Remove the used code from the array of backup codes
  const remainingCodes = [
    ...storedBackupCodes.slice(0, codeIndex),
    ...storedBackupCodes.slice(codeIndex + 1)
  ];
  
  return { success: true, remainingCodes };
};

/**
 * Log security events related to 2FA
 */
export const logSecurityEvent = (eventData: any): void => {
  // In a production environment, this would log to a secure audit log
  console.log(`[SECURITY EVENT] ${new Date().toISOString()}:`, eventData);
  
  // TODO: Implement more sophisticated logging mechanism for security events
  // This could include writing to a database, sending alerts, etc.
};