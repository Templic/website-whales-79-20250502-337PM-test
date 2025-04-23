/**
 * Quantum-Resistant Multi-Factor Authentication System
 * 
 * This module provides a comprehensive MFA system that uses quantum-resistant
 * cryptographic primitives for additional security while maintaining backward
 * compatibility with traditional authentication methods.
 */

import crypto from 'crypto';
import { totp, authenticator } from '@otplib/preset-default';
import QRCode from 'qrcode';
import { SecurityEventCategory, SecurityEventSeverity } from '../advanced/SecurityFabric';
import { logSecurityEvent } from '../advanced/SecurityLogger';
import { QuantumResistantCrypto } from '../advanced/quantum/QuantumResistantCrypto';

// Constants
const DEFAULT_TOTP_WINDOW = 1; // Allow codes from 1 window before/after
const DEFAULT_TOTP_DIGITS = 6;  // 6-digit codes
const DEFAULT_TOTP_PERIOD = 30; // 30-second window

// Supported MFA types
export enum MFAType {
  TOTP = 'totp',          // Time-based One Time Password
  EMAIL = 'email',        // Email verification codes
  SMS = 'sms',            // SMS verification codes
  PUSH = 'push',          // Push notification to mobile device
  RECOVERY = 'recovery',  // Recovery codes
  BIOMETRIC = 'biometric' // Biometric authentication (template)
}

// MFA verification status
export enum MFAVerificationStatus {
  SUCCESS = 'success',
  FAILED = 'failed',
  EXPIRED = 'expired',
  INVALID = 'invalid',
  THROTTLED = 'throttled',
  NOT_ENABLED = 'not_enabled'
}

// Interface for an MFA method
export interface MFAMethod {
  type: MFAType;
  userId: number | string;
  secret?: string;
  encryptedSecret?: string;
  verified: boolean;
  lastUsed?: Date;
  createdAt: Date;
  updatedAt: Date;
  additionalData?: Record<string, any>;
}

// TOTP-specific configuration
export interface TOTPConfig {
  digits: number;       // Number of digits in the code
  period: number;       // Time step in seconds (typically 30)
  window: number;       // Time window tolerance
  algorithm: string;    // Hashing algorithm (SHA-1, SHA-256, SHA-512)
  issuer: string;       // Service name (e.g. "MyApp")
  label: string;        // User identifier (e.g. email or username)
}

/**
 * Main class providing multi-factor authentication functionality
 */
export class MFAManager {
  private static instance: MFAManager;
  private qrc: typeof QRCode;
  private quantumCrypto: QuantumResistantCrypto;
  private appName: string;
  private failedAttemptsMap: Map<string, {count: number, lastAttempt: Date}> = new Map();
  private throttleThreshold = 5; // Maximum failed attempts before throttling
  private throttleDuration = 30 * 60 * 1000; // 30 minutes in milliseconds

  private constructor(appName: string = 'SecureApp') {
    this.qrc = QRCode;
    this.appName = appName;
    this.quantumCrypto = QuantumResistantCrypto.getInstance();
    
    // Configure TOTP library with secure defaults
    totp.options = { 
      digits: DEFAULT_TOTP_DIGITS,
      step: DEFAULT_TOTP_PERIOD,
      window: DEFAULT_TOTP_WINDOW
    };
  }

  /**
   * Get singleton instance of MFAManager
   */
  public static getInstance(appName?: string): MFAManager {
    if (!MFAManager.instance) {
      MFAManager.instance = new MFAManager(appName);
    }
    return MFAManager.instance;
  }

  /**
   * Generate a new TOTP secret for a user
   */
  public async generateTOTPSecret(userId: number | string, config?: Partial<TOTPConfig>): Promise<{
    secret: string;
    encryptedSecret: string;
    uri: string;
    qrCode: string;
  }> {
    try {
      // Generate a secure secret
      const secret = authenticator.generateSecret();
      
      // Encrypt the secret using quantum-resistant encryption
      const encryptedSecret = await this.encryptSecret(secret);
      
      // Create config with defaults and overrides
      const totpConfig: TOTPConfig = {
        digits: config?.digits || DEFAULT_TOTP_DIGITS,
        period: config?.period || DEFAULT_TOTP_PERIOD,
        window: config?.window || DEFAULT_TOTP_WINDOW,
        algorithm: config?.algorithm || 'sha1',
        issuer: config?.issuer || this.appName,
        label: config?.label || `user-${userId}`
      };
      
      // Generate the URI for QR code
      const uri = authenticator.keyuri(
        totpConfig.label,
        totpConfig.issuer,
        secret
      );
      
      // Generate QR code
      const qrCode = await this.generateQRCode(uri);
      
      return {
        secret,
        encryptedSecret,
        uri,
        qrCode
      };
    } catch (error) {
      logSecurityEvent({
        category: SecurityEventCategory.AUTHENTICATION,
        severity: SecurityEventSeverity.ERROR,
        message: `Failed to generate TOTP secret for user ${userId}`,
        data: { error: (error as Error).message, userId }
      });
      throw new Error(`Failed to generate TOTP secret: ${(error as Error).message}`);
    }
  }
  
  /**
   * Verify a TOTP code provided by a user
   */
  public async verifyTOTP(
    userId: number | string, 
    token: string, 
    secret: string
  ): Promise<MFAVerificationStatus> {
    try {
      // Check for throttling
      if (this.isThrottled(userId.toString())) {
        logSecurityEvent({
          category: SecurityEventCategory.AUTHENTICATION,
          severity: SecurityEventSeverity.WARNING,
          message: `MFA verification throttled for user ${userId}`,
          data: { userId, mfaType: MFAType.TOTP }
        });
        return MFAVerificationStatus.THROTTLED;
      }
      
      // Verify the token
      const isValid = totp.verify({ token, secret });
      
      if (isValid) {
        // Reset failed attempts on success
        this.resetFailedAttempts(userId.toString());
        
        logSecurityEvent({
          category: SecurityEventCategory.AUTHENTICATION,
          severity: SecurityEventSeverity.INFO,
          message: `Successful MFA verification for user ${userId}`,
          data: { userId, mfaType: MFAType.TOTP }
        });
        
        return MFAVerificationStatus.SUCCESS;
      } else {
        // Increment failed attempts
        this.incrementFailedAttempts(userId.toString());
        
        logSecurityEvent({
          category: SecurityEventCategory.AUTHENTICATION,
          severity: SecurityEventSeverity.WARNING,
          message: `Failed MFA verification for user ${userId}`,
          data: { userId, mfaType: MFAType.TOTP }
        });
        
        return MFAVerificationStatus.FAILED;
      }
    } catch (error) {
      logSecurityEvent({
        category: SecurityEventCategory.AUTHENTICATION,
        severity: SecurityEventSeverity.ERROR,
        message: `Error during MFA verification for user ${userId}`,
        data: { error: (error as Error).message, userId, mfaType: MFAType.TOTP }
      });
      
      return MFAVerificationStatus.INVALID;
    }
  }
  
  /**
   * Generate recovery codes for a user
   */
  public generateRecoveryCodes(count: number = 10): string[] {
    const codes: string[] = [];
    
    for (let i = 0; i < count; i++) {
      // Generate a cryptographically secure recovery code
      // Format: 4 groups of 4 alphanumeric characters separated by dashes
      const code = [
        this.generateRandomString(4),
        this.generateRandomString(4),
        this.generateRandomString(4),
        this.generateRandomString(4),
      ].join('-');
      
      codes.push(code);
    }
    
    return codes;
  }
  
  /**
   * Hash recovery codes for secure storage
   */
  public async hashRecoveryCodes(codes: string[]): Promise<string[]> {
    const hashedCodes: string[] = [];
    
    for (const code of codes) {
      // Use quantum-resistant hash for the recovery codes
      const hashedCode = await this.quantumCrypto.hashData(code, 'sha3-256');
      hashedCodes.push(hashedCode);
    }
    
    return hashedCodes;
  }
  
  /**
   * Verify a recovery code
   */
  public async verifyRecoveryCode(
    userId: number | string,
    providedCode: string,
    hashedCodes: string[]
  ): Promise<MFAVerificationStatus> {
    try {
      // Check for throttling
      if (this.isThrottled(userId.toString())) {
        return MFAVerificationStatus.THROTTLED;
      }
      
      // Hash the provided code
      const hashedProvidedCode = await this.quantumCrypto.hashData(providedCode, 'sha3-256');
      
      // Check if the hashed code exists in the array of hashed codes
      const matchIndex = hashedCodes.findIndex(code => code === hashedProvidedCode);
      
      if (matchIndex !== -1) {
        // Reset failed attempts on success
        this.resetFailedAttempts(userId.toString());
        
        logSecurityEvent({
          category: SecurityEventCategory.AUTHENTICATION,
          severity: SecurityEventSeverity.INFO,
          message: `Recovery code used for user ${userId}`,
          data: { userId, mfaType: MFAType.RECOVERY }
        });
        
        return MFAVerificationStatus.SUCCESS;
      } else {
        // Increment failed attempts
        this.incrementFailedAttempts(userId.toString());
        
        logSecurityEvent({
          category: SecurityEventCategory.AUTHENTICATION,
          severity: SecurityEventSeverity.WARNING,
          message: `Invalid recovery code used for user ${userId}`,
          data: { userId, mfaType: MFAType.RECOVERY }
        });
        
        return MFAVerificationStatus.FAILED;
      }
    } catch (error) {
      logSecurityEvent({
        category: SecurityEventCategory.AUTHENTICATION,
        severity: SecurityEventSeverity.ERROR,
        message: `Error during recovery code verification for user ${userId}`,
        data: { error: (error as Error).message, userId, mfaType: MFAType.RECOVERY }
      });
      
      return MFAVerificationStatus.INVALID;
    }
  }
  
  /**
   * Generate and send email verification code
   */
  public async generateEmailCode(
    userId: number | string,
    email: string
  ): Promise<string> {
    try {
      // Generate a secure 6-digit code
      const code = this.generateRandomDigits(6);
      
      // NOTE: In a real implementation, you would send this code via email
      // For now, we'll just log it and return it for testing purposes
      
      logSecurityEvent({
        category: SecurityEventCategory.AUTHENTICATION,
        severity: SecurityEventSeverity.INFO,
        message: `Email verification code generated for user ${userId}`,
        data: { userId, email, mfaType: MFAType.EMAIL }
      });
      
      return code;
    } catch (error) {
      logSecurityEvent({
        category: SecurityEventCategory.AUTHENTICATION,
        severity: SecurityEventSeverity.ERROR,
        message: `Failed to generate email verification code for user ${userId}`,
        data: { error: (error as Error).message, userId, email, mfaType: MFAType.EMAIL }
      });
      
      throw new Error(`Failed to generate email verification code: ${(error as Error).message}`);
    }
  }
  
  /**
   * Generate and send SMS verification code
   */
  public async generateSMSCode(
    userId: number | string,
    phoneNumber: string
  ): Promise<string> {
    try {
      // Generate a secure 6-digit code
      const code = this.generateRandomDigits(6);
      
      // NOTE: In a real implementation, you would send this code via SMS
      // For now, we'll just log it and return it for testing purposes
      
      logSecurityEvent({
        category: SecurityEventCategory.AUTHENTICATION,
        severity: SecurityEventSeverity.INFO,
        message: `SMS verification code generated for user ${userId}`,
        data: { userId, phoneNumber, mfaType: MFAType.SMS }
      });
      
      return code;
    } catch (error) {
      logSecurityEvent({
        category: SecurityEventCategory.AUTHENTICATION,
        severity: SecurityEventSeverity.ERROR,
        message: `Failed to generate SMS verification code for user ${userId}`,
        data: { error: (error as Error).message, userId, phoneNumber, mfaType: MFAType.SMS }
      });
      
      throw new Error(`Failed to generate SMS verification code: ${(error as Error).message}`);
    }
  }
  
  /**
   * Verify an email or SMS code
   */
  public verifyCode(
    userId: number | string,
    providedCode: string,
    expectedCode: string,
    type: MFAType.EMAIL | MFAType.SMS,
    expirationTime?: Date
  ): MFAVerificationStatus {
    try {
      // Check for throttling
      if (this.isThrottled(userId.toString())) {
        return MFAVerificationStatus.THROTTLED;
      }
      
      // Check for expiration if an expiration time is provided
      if (expirationTime && expirationTime < new Date()) {
        // Increment failed attempts
        this.incrementFailedAttempts(userId.toString());
        
        logSecurityEvent({
          category: SecurityEventCategory.AUTHENTICATION,
          severity: SecurityEventSeverity.WARNING,
          message: `Expired ${type} verification code used for user ${userId}`,
          data: { userId, mfaType: type }
        });
        
        return MFAVerificationStatus.EXPIRED;
      }
      
      // Check if the codes match
      if (providedCode === expectedCode) {
        // Reset failed attempts on success
        this.resetFailedAttempts(userId.toString());
        
        logSecurityEvent({
          category: SecurityEventCategory.AUTHENTICATION,
          severity: SecurityEventSeverity.INFO,
          message: `Successful ${type} verification for user ${userId}`,
          data: { userId, mfaType: type }
        });
        
        return MFAVerificationStatus.SUCCESS;
      } else {
        // Increment failed attempts
        this.incrementFailedAttempts(userId.toString());
        
        logSecurityEvent({
          category: SecurityEventCategory.AUTHENTICATION,
          severity: SecurityEventSeverity.WARNING,
          message: `Failed ${type} verification for user ${userId}`,
          data: { userId, mfaType: type }
        });
        
        return MFAVerificationStatus.FAILED;
      }
    } catch (error) {
      logSecurityEvent({
        category: SecurityEventCategory.AUTHENTICATION,
        severity: SecurityEventSeverity.ERROR,
        message: `Error during ${type} verification for user ${userId}`,
        data: { error: (error as Error).message, userId, mfaType: type }
      });
      
      return MFAVerificationStatus.INVALID;
    }
  }
  
  /**
   * Generate a push notification challenge
   */
  public async generatePushChallenge(
    userId: number | string,
    deviceToken: string
  ): Promise<string> {
    try {
      // Generate a unique challenge ID
      const challengeId = crypto.randomUUID();
      
      // NOTE: In a real implementation, you would send a push notification
      // to the user's device with the challenge information
      // For now, we'll just log it and return the challenge ID for testing
      
      logSecurityEvent({
        category: SecurityEventCategory.AUTHENTICATION,
        severity: SecurityEventSeverity.INFO,
        message: `Push challenge generated for user ${userId}`,
        data: { userId, deviceToken, challengeId, mfaType: MFAType.PUSH }
      });
      
      return challengeId;
    } catch (error) {
      logSecurityEvent({
        category: SecurityEventCategory.AUTHENTICATION,
        severity: SecurityEventSeverity.ERROR,
        message: `Failed to generate push challenge for user ${userId}`,
        data: { error: (error as Error).message, userId, deviceToken, mfaType: MFAType.PUSH }
      });
      
      throw new Error(`Failed to generate push challenge: ${(error as Error).message}`);
    }
  }

  // Helper method - Encrypt a secret using quantum-resistant encryption
  private async encryptSecret(secret: string): Promise<string> {
    try {
      // Use quantum-resistant encryption to secure the secret
      const encrypted = await this.quantumCrypto.encryptData(
        secret,
        'kyber', // Use Kyber for key encapsulation
        'high'   // Use high security level
      );
      
      return encrypted.ciphertext;
    } catch (error) {
      throw new Error(`Failed to encrypt secret: ${(error as Error).message}`);
    }
  }

  // Helper method - Decrypt a secret that was encrypted with quantum-resistant encryption
  private async decryptSecret(encryptedSecret: string, encapsulatedKey: string): Promise<string> {
    try {
      // Use quantum-resistant decryption to retrieve the secret
      const decrypted = await this.quantumCrypto.decryptData(
        encryptedSecret,
        encapsulatedKey,
        'kyber', // Same algorithm used for encryption
        'high'   // Same security level used for encryption
      );
      
      return decrypted.plaintext;
    } catch (error) {
      throw new Error(`Failed to decrypt secret: ${(error as Error).message}`);
    }
  }

  // Helper method - Generate a QR code for the TOTP URI
  private async generateQRCode(uri: string): Promise<string> {
    try {
      // Generate a data URL for the QR code
      return await this.qrc.toDataURL(uri);
    } catch (error) {
      throw new Error(`Failed to generate QR code: ${(error as Error).message}`);
    }
  }

  // Helper method - Generate a random string of alphanumeric characters
  private generateRandomString(length: number): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    
    const randomBytes = crypto.randomBytes(length);
    for (let i = 0; i < length; i++) {
      // Use modulo to convert random bytes to charset indices
      const index = randomBytes[i] % charset.length;
      result += charset[index];
    }
    
    return result;
  }

  // Helper method - Generate random digits
  private generateRandomDigits(length: number): string {
    let result = '';
    
    const randomBytes = crypto.randomBytes(length);
    for (let i = 0; i < length; i++) {
      // Use modulo to convert random bytes to digits 0-9
      const digit = randomBytes[i] % 10;
      result += digit.toString();
    }
    
    return result;
  }

  // Throttling management methods
  private isThrottled(userId: string): boolean {
    const attempts = this.failedAttemptsMap.get(userId);
    
    if (!attempts) {
      return false;
    }
    
    if (attempts.count >= this.throttleThreshold) {
      const now = new Date();
      const timeSinceLastAttempt = now.getTime() - attempts.lastAttempt.getTime();
      
      if (timeSinceLastAttempt < this.throttleDuration) {
        return true;
      } else {
        // Reset if throttle duration has passed
        this.resetFailedAttempts(userId);
        return false;
      }
    }
    
    return false;
  }

  private incrementFailedAttempts(userId: string): void {
    const attempts = this.failedAttemptsMap.get(userId);
    
    if (attempts) {
      this.failedAttemptsMap.set(userId, {
        count: attempts.count + 1,
        lastAttempt: new Date()
      });
    } else {
      this.failedAttemptsMap.set(userId, {
        count: 1,
        lastAttempt: new Date()
      });
    }
  }

  private resetFailedAttempts(userId: string): void {
    this.failedAttemptsMap.delete(userId);
  }
}

// Export a singleton instance
export const mfaManager = MFAManager.getInstance();