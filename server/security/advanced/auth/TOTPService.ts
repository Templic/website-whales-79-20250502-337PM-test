/**
 * TOTP Authentication Service
 * 
 * This service provides Time-based One-Time Password (TOTP) functionality
 * for implementing Multi-Factor Authentication (MFA) in the application.
 * 
 * Features:
 * - Generate TOTP secrets for users
 * - Verify TOTP tokens
 * - Manage backup codes for emergency access
 * - Remember trusted devices
 */

import { authenticator } from 'otplib';  // Use the main otplib package
import { nanoid } from 'nanoid';
import * as QRCode from 'qrcode';
import { db } from '../../../db';
import { userMfaSettings, type UserMfaSettings, type InsertUserMfaSettings } from '../../../../shared/schema';
import { eq } from 'drizzle-orm';

/**
 * Interface for verified device
 */
interface VerifiedDevice {
  id: string;
  name: string;
  lastUsed: number;
  userAgent?: string;
  ip?: string;
}

/**
 * Generate a set of backup codes for emergency access
 */
function generateBackupCodes(count: number = 8): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    // Format: xxxx-xxxx-xxxx where x is alphanumeric
    // but avoid confusing characters like 0/O or 1/I/l
    const code = nanoid(12).replace(/[0OIl1]/g, () => {
      const replacements = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz';
      return replacements.charAt(Math.floor(Math.random() * replacements.length));
    });
    // Insert dashes for readability
    codes.push(`${code.slice(0, 4)}-${code.slice(4, 8)}-${code.slice(8, 12)}`);
  }
  return codes;
}

/**
 * TOTP Service class for MFA functionality
 */
export class TOTPService {
  private issuer: string;
  
  constructor(issuer: string = 'Admin Portal') {
    this.issuer = issuer;
    
    // Configure authenticator
    authenticator.options = {
      step: 30, // Time step in seconds
      window: 1  // Allow 1 step before and after current step for clock skew
    };
  }
  
  /**
   * Generate a new TOTP secret for a user
   */
  async generateSecret(userId: string, username: string): Promise<{
    secret: string;
    uri: string;
    qrCodeUrl: string;
  }> {
    // Generate a new secret
    const secret = authenticator.generateSecret();
    
    // Create the URI for the QR code
    const uri = authenticator.keyuri(username, this.issuer, secret);
    
    // Generate QR code as data URL
    const qrCodeUrl = await QRCode.toDataURL(uri);
    
    // Store in database (but not enabled yet)
    await db.insert(userMfaSettings).values({
      userId,
      totpSecret: secret,
      backupCodes: generateBackupCodes(),
      enabled: false,
      verifiedDevices: []
    }).onConflictDoUpdate({
      target: userMfaSettings.userId,
      set: {
        totpSecret: secret,
        backupCodes: generateBackupCodes(),
        updatedAt: new Date()
      }
    });
    
    return {
      secret,
      uri,
      qrCodeUrl
    };
  }
  
  /**
   * Verify a TOTP token
   */
  async verifyToken(userId: string, token: string): Promise<boolean> {
    // Get user's MFA settings
    const [settings] = await db
      .select()
      .from(userMfaSettings)
      .where(eq(userMfaSettings.userId, userId));
    
    if (!settings || !settings.totpSecret) {
      return false;
    }
    
    try {
      const isValid = authenticator.verify({
        token,
        secret: settings.totpSecret
      });
      
      if (isValid) {
        // Update last verified timestamp
        await db
          .update(userMfaSettings)
          .set({
            lastVerified: new Date(),
            updatedAt: new Date()
          })
          .where(eq(userMfaSettings.userId, userId));
      }
      
      return isValid;
    } catch (error) {
      console.error('Error verifying TOTP token:', error);
      return false;
    }
  }
  
  /**
   * Verify a backup code
   */
  async verifyBackupCode(userId: string, code: string): Promise<boolean> {
    // Get user's MFA settings
    const [settings] = await db
      .select()
      .from(userMfaSettings)
      .where(eq(userMfaSettings.userId, userId));
    
    if (!settings || !settings.backupCodes || !settings.backupCodes.length) {
      return false;
    }
    
    // Check if the provided code is in the backup codes
    const index = settings.backupCodes.indexOf(code);
    if (index === -1) {
      return false;
    }
    
    // Remove the used backup code
    const updatedCodes = [...settings.backupCodes];
    updatedCodes.splice(index, 1);
    
    // Update backup codes in database
    await db
      .update(userMfaSettings)
      .set({
        backupCodes: updatedCodes,
        lastVerified: new Date(),
        updatedAt: new Date()
      })
      .where(eq(userMfaSettings.userId, userId));
    
    return true;
  }
  
  /**
   * Enable MFA for a user
   */
  async enableMFA(userId: string): Promise<boolean> {
    try {
      await db
        .update(userMfaSettings)
        .set({
          enabled: true,
          updatedAt: new Date()
        })
        .where(eq(userMfaSettings.userId, userId));
      
      return true;
    } catch (error) {
      console.error('Error enabling MFA:', error);
      return false;
    }
  }
  
  /**
   * Disable MFA for a user
   */
  async disableMFA(userId: string): Promise<boolean> {
    try {
      await db
        .update(userMfaSettings)
        .set({
          enabled: false,
          updatedAt: new Date()
        })
        .where(eq(userMfaSettings.userId, userId));
      
      return true;
    } catch (error) {
      console.error('Error disabling MFA:', error);
      return false;
    }
  }
  
  /**
   * Register a verified device
   */
  async registerVerifiedDevice(
    userId: string,
    deviceName: string,
    userAgent?: string,
    ip?: string
  ): Promise<string> {
    const [settings] = await db
      .select()
      .from(userMfaSettings)
      .where(eq(userMfaSettings.userId, userId));
    
    if (!settings) {
      throw new Error('User MFA settings not found');
    }
    
    const deviceId = nanoid();
    const verifiedDevices = settings.verifiedDevices || [];
    
    // Add the new device
    const newDevice: VerifiedDevice = {
      id: deviceId,
      name: deviceName,
      lastUsed: Date.now(),
      userAgent,
      ip
    };
    
    // Save the updated device list
    await db
      .update(userMfaSettings)
      .set({
        verifiedDevices: [...verifiedDevices, newDevice],
        updatedAt: new Date()
      })
      .where(eq(userMfaSettings.userId, userId));
    
    return deviceId;
  }
  
  /**
   * Check if a device is verified
   */
  async isDeviceVerified(userId: string, deviceId: string): Promise<boolean> {
    const [settings] = await db
      .select()
      .from(userMfaSettings)
      .where(eq(userMfaSettings.userId, userId));
    
    if (!settings || !settings.verifiedDevices) {
      return false;
    }
    
    // Find device in the verified list
    const device = settings.verifiedDevices.find(d => d.id === deviceId);
    if (!device) {
      return false;
    }
    
    // Update the last used timestamp
    await this.updateDeviceLastUsed(userId, deviceId);
    
    return true;
  }
  
  /**
   * Update the last used timestamp for a device
   */
  private async updateDeviceLastUsed(userId: string, deviceId: string): Promise<void> {
    const [settings] = await db
      .select()
      .from(userMfaSettings)
      .where(eq(userMfaSettings.userId, userId));
    
    if (!settings || !settings.verifiedDevices) {
      return;
    }
    
    const verifiedDevices = [...settings.verifiedDevices];
    const deviceIndex = verifiedDevices.findIndex(d => d.id === deviceId);
    
    if (deviceIndex !== -1) {
      verifiedDevices[deviceIndex] = {
        ...verifiedDevices[deviceIndex],
        lastUsed: Date.now()
      };
      
      await db
        .update(userMfaSettings)
        .set({
          verifiedDevices,
          updatedAt: new Date()
        })
        .where(eq(userMfaSettings.userId, userId));
    }
  }
  
  /**
   * Remove a verified device
   */
  async removeVerifiedDevice(userId: string, deviceId: string): Promise<boolean> {
    const [settings] = await db
      .select()
      .from(userMfaSettings)
      .where(eq(userMfaSettings.userId, userId));
    
    if (!settings || !settings.verifiedDevices) {
      return false;
    }
    
    const verifiedDevices = settings.verifiedDevices.filter(d => d.id !== deviceId);
    
    await db
      .update(userMfaSettings)
      .set({
        verifiedDevices,
        updatedAt: new Date()
      })
      .where(eq(userMfaSettings.userId, userId));
    
    return true;
  }
  
  /**
   * Get user's MFA status
   */
  async getMFAStatus(userId: string): Promise<{
    enabled: boolean;
    verifiedDeviceCount: number;
    lastVerified?: Date;
    backupCodesRemaining: number;
  }> {
    const [settings] = await db
      .select()
      .from(userMfaSettings)
      .where(eq(userMfaSettings.userId, userId));
    
    if (!settings) {
      return {
        enabled: false,
        verifiedDeviceCount: 0,
        backupCodesRemaining: 0
      };
    }
    
    return {
      enabled: settings.enabled,
      verifiedDeviceCount: settings.verifiedDevices?.length || 0,
      lastVerified: settings.lastVerified,
      backupCodesRemaining: settings.backupCodes?.length || 0
    };
  }
  
  /**
   * Get user MFA settings
   */
  async getUserSettings(userId: string): Promise<UserMfaSettings | undefined> {
    const [settings] = await db
      .select()
      .from(userMfaSettings)
      .where(eq(userMfaSettings.userId, userId));
    
    return settings;
  }

  /**
   * Regenerate backup codes
   */
  async regenerateBackupCodes(userId: string): Promise<string[]> {
    const newBackupCodes = generateBackupCodes();
    
    await db
      .update(userMfaSettings)
      .set({
        backupCodes: newBackupCodes,
        updatedAt: new Date()
      })
      .where(eq(userMfaSettings.userId, userId));
    
    return newBackupCodes;
  }
}

// Create a singleton instance of the TOTP service
export const totpService = new TOTPService();