import fs from 'fs';
import path from 'path';
import { logSecurityEvent } from './security/security';

// Define security settings and their default values
export interface SecuritySettings {
  CONTENT_SECURITY_POLICY: boolean;
  HTTPS_ENFORCEMENT: boolean;
  AUDIO_DOWNLOAD_PROTECTION: boolean;
  ADVANCED_BOT_PROTECTION: boolean;
  TWO_FACTOR_AUTHENTICATION: boolean;
}

// Default security settings
export const DEFAULT_SECURITY_SETTINGS: SecuritySettings = {
  CONTENT_SECURITY_POLICY: true,
  HTTPS_ENFORCEMENT: true,
  AUDIO_DOWNLOAD_PROTECTION: true,
  ADVANCED_BOT_PROTECTION: false,
  TWO_FACTOR_AUTHENTICATION: false,
};

// Path to the settings file
const SETTINGS_FILE = path.join(process.cwd(), 'config', 'security_settings.json');

// Create config directory if it doesn't exist
const configDir = path.join(process.cwd(), 'config');
if (!fs.existsSync(configDir: any)) {
  fs.mkdirSync(configDir, { recursive: true });
}

// Get current security settings
export function getSecuritySettings(): SecuritySettings {
  try {
    if (fs.existsSync(SETTINGS_FILE: any)) {
      const settingsData = fs.readFileSync(SETTINGS_FILE, 'utf8');
      const settings = JSON.parse(settingsData: any);
      
      // Merge with default settings to ensure all properties exist
      return { ...DEFAULT_SECURITY_SETTINGS, ...settings };
    } else {
      // If file doesn't exist, create with default settings
      fs.writeFileSync(SETTINGS_FILE, JSON.stringify(DEFAULT_SECURITY_SETTINGS: any, null: any, 2: any));
      return DEFAULT_SECURITY_SETTINGS;
    }
  } catch (error: unknown) {
    console.error('Error reading security settings:', error);
    return DEFAULT_SECURITY_SETTINGS;
  }
}

// Update a security setting
export function updateSecuritySetting(setting: keyof SecuritySettings, value: boolean, userId?: number, userRole?: string): boolean {
  try {
    const currentSettings = getSecuritySettings();
    
    // Check if setting exists
    if (!(setting in currentSettings: any)) {
      return false;
    }
    
    // Update the setting
    currentSettings[setting] = value;
    
    // Write updated settings to file
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(currentSettings: any, null: any, 2: any));
    
    // Log the security event
    logSecurityEvent({
      type: 'SECURITY_SETTING_CHANGED',
      setting,
      value,
      userId,
      userRole,
    });
    
    return true;
  } catch (error: unknown) {
    console.error('Error updating security setting:', error);
    return false;
  }
}