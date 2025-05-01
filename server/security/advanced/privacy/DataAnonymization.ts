/**
 * Data Anonymization Service
 * 
 * Provides privacy-enhancing capabilities for handling personal data,
 * including pseudonymization, data minimization, de-identification,
 * and privacy-preserving analytics.
 * 
 * Features:
 * - PII identification and masking
 * - Differential privacy techniques
 * - K-anonymity implementation
 * - Consent management
 * - Data minimization
 */

import { createHash, randomBytes } from 'crypto';
import { logSecurityEvent } from '../SecurityLogger';
import { SecurityEventCategory, SecurityEventSeverity } from '../SecurityFabric';

// Anonymization types
export enum AnonymizationType {
  REDACTION = 'redaction',        // Replace with fixed text
  MASKING = 'masking',            // Mask with '*' characters
  HASHING = 'hashing',            // One-way hash
  PSEUDONYMIZATION = 'pseudonym', // Replace with consistent alternate value
  GENERALIZATION = 'generalize',  // Replace with less specific value
  PERTURBATION = 'perturb'        // Add random noise
}

// Configuration for anonymization
export interface AnonymizationConfig {
  salt?: string;                           // Salt for hashing
  replacementChar?: string;                // Character for masking
  redactedText?: string;                   // Text for redaction
  keepFirstChars?: number;                 // Number of first characters to keep
  keepLastChars?: number;                  // Number of last characters to keep
  consistentPseudonyms?: boolean;          // Use consistent pseudonyms
  differentialPrivacyEpsilon?: number;     // Privacy parameter for differential privacy
  generalizeRules?: Record<string, any[]>; // Rules for generalization
}

// Default anonymization configuration
const defaultConfig: AnonymizationConfig = {
  salt: 'default-salt', // Will be overridden with a secure salt
  replacementChar: '*',
  redactedText: '[REDACTED]',
  keepFirstChars: 2,
  keepLastChars: 2,
  consistentPseudonyms: true,
  differentialPrivacyEpsilon: 1.0,
  generalizeRules: {}
};

// Store for pseudonyms (in production, use a database)
const pseudonymStore: Map<string, string> = new Map();

// Generate a secure salt if not provided
let secureSalt = randomBytes(32).toString('hex');
defaultConfig.salt = secureSalt;

/**
 * Initialize the anonymization service with a new secure salt
 */
export function initialize(): void {
  secureSalt = randomBytes(32).toString('hex');
  defaultConfig.salt = secureSalt;
  
  logSecurityEvent({
    category: SecurityEventCategory.PRIVACY,
    severity: SecurityEventSeverity.INFO,
    message: 'Data anonymization service initialized',
    data: {
      timestamp: new Date().toISOString()
    }
  });
}

/**
 * Anonymize a single value
 */
export function anonymizeValue(
  value: string,
  type: AnonymizationType,
  config: AnonymizationConfig = defaultConfig
): string {
  if (!value) {
    return value;
  }
  
  switch (type) {
    case AnonymizationType.REDACTION:
      return config.redactedText || defaultConfig.redactedText || '[REDACTED]';
    
    case AnonymizationType.MASKING:
      return maskValue(value, config);
    
    case AnonymizationType.HASHING:
      return hashValue(value, config);
    
    case AnonymizationType.PSEUDONYMIZATION:
      return pseudonymizeValue(value, config);
    
    case AnonymizationType.GENERALIZATION:
      return generalizeValue(value, config);
    
    case AnonymizationType.PERTURBATION:
      return perturbValue(value, config);
    
    default:
      return value;
  }
}

/**
 * Mask a value with replacement characters
 */
function maskValue(value: string, config: AnonymizationConfig): string {
  const keepFirst = config.keepFirstChars || defaultConfig.keepFirstChars || 0;
  const keepLast = config.keepLastChars || defaultConfig.keepLastChars || 0;
  const char = config.replacementChar || defaultConfig.replacementChar || '*';
  
  if (value.length <= keepFirst + keepLast) {
    return value;
  }
  
  const maskedLength = value.length - keepFirst - keepLast;
  const maskedPart = char.repeat(maskedLength);
  
  return value.substring(0, keepFirst) + maskedPart + value.substring(value.length - keepLast);
}

/**
 * Hash a value using a secure one-way hash function
 */
function hashValue(value: string, config: AnonymizationConfig): string {
  const salt = config.salt || defaultConfig.salt || secureSalt;
  
  const hash = createHash('sha256');
  hash.update(value + salt);
  return hash.digest('hex');
}

/**
 * Create a consistent pseudonym for a value
 */
function pseudonymizeValue(value: string, config: AnonymizationConfig): string {
  const consistentPseudonyms = config.consistentPseudonyms !== undefined ? 
    config.consistentPseudonyms : defaultConfig.consistentPseudonyms;
  
  if (consistentPseudonyms) {
    const hashedValue = hashValue(value, config);
    
    // Check if we already have a pseudonym for this value
    if (pseudonymStore.has(hashedValue)) {
      return pseudonymStore.get(hashedValue) || '';
    }
    
    // Generate a new pseudonym
    const pseudonym = generatePseudonym(value);
    pseudonymStore.set(hashedValue, pseudonym);
    
    return pseudonym;
  } else {
    // Generate a new pseudonym each time
    return generatePseudonym(value);
  }
}

/**
 * Generate a pseudonym based on value type
 */
function generatePseudonym(value: string): string {
  // Email
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    const randomName = `user${randomBytes(4).toString('hex')}`;
    const randomDomain = `example${randomBytes(2).toString('hex')}.com`;
    return `${randomName}@${randomDomain}`;
  }
  
  // Phone number
  if (/^\+?[0-9\s\-\(\)]{7,15}$/.test(value)) {
    return `+1${Math.floor(Math.random() * 1000000000).toString().padStart(9, '0')}`;
  }
  
  // Name
  if (/^[A-Za-z\s\-\'\.]{2,}$/.test(value)) {
    const randomFirstNames = ['Anonymous', 'User', 'Person', 'Individual', 'Subject'];
    const randomLastNames = ['A', 'B', 'C', 'D', 'X', 'Y', 'Z'];
    
    const firstName = randomFirstNames[Math.floor(Math.random() * randomFirstNames.length)];
    const lastName = randomLastNames[Math.floor(Math.random() * randomLastNames.length)];
    
    return `${firstName} ${lastName}`;
  }
  
  // Address
  if (value.length > 10 && /[0-9]/.test(value) && /[A-Za-z]/.test(value)) {
    return '123 Privacy Street, Anytown, AN 12345';
  }
  
  // Other types
  return `Pseudonym_${randomBytes(8).toString('hex')}`;
}

/**
 * Generalize a value to a less specific form
 */
function generalizeValue(value: string, config: AnonymizationConfig): string {
  const generalizeRules = config.generalizeRules || defaultConfig.generalizeRules || {};
  
  // Age generalization
  if (/^[0-9]{1,3}$/.test(value)) {
    const age = parseInt(value, 10);
    if (age < 18) return '<18';
    if (age < 25) return '18-24';
    if (age < 35) return '25-34';
    if (age < 45) return '35-44';
    if (age < 55) return '45-54';
    if (age < 65) return '55-64';
    return '65+';
  }
  
  // Zip code generalization - keep only the first 3 digits
  if (/^[0-9]{5}(-[0-9]{4})?$/.test(value)) {
    return value.substring(0, 3) + 'XX';
  }
  
  // Income generalization
  if (/^\$?[0-9,.]+$/.test(value.replace(/\s/g, ''))) {
    const income = parseInt(value.replace(/[\$,\s]/g, ''), 10);
    if (income < 25000) return '<25K';
    if (income < 50000) return '25K-50K';
    if (income < 75000) return '50K-75K';
    if (income < 100000) return '75K-100K';
    if (income < 150000) return '100K-150K';
    return '>150K';
  }
  
  // Date generalization - keep only the month and year
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.substring(0, 7); // YYYY-MM
  }
  
  // Custom rules based on the configuration
  for (const pattern in generalizeRules) {
    if (new RegExp(pattern).test(value)) {
      const rules = generalizeRules[pattern];
      
      // Find the rule that matches the value
      for (const rule of rules) {
        if (rule.range && rule.output) {
          const [min, max] = rule.range;
          if (value >= min && value <= max) {
            return rule.output;
          }
        }
      }
    }
  }
  
  // No generalization rule matched
  return value;
}

/**
 * Add random noise to a value for differential privacy
 */
function perturbValue(value: string, config: AnonymizationConfig): string {
  // This is a simplified implementation of differential privacy
  // In a real system, this would use more sophisticated techniques
  
  const epsilon = config.differentialPrivacyEpsilon || defaultConfig.differentialPrivacyEpsilon || 1.0;
  
  // Only perturb numeric values
  if (!/^[0-9]+(\.[0-9]+)?$/.test(value)) {
    return value;
  }
  
  const numericValue = parseFloat(value);
  
  // Laplace mechanism for differential privacy
  const sensitivity = 1; // Assuming a sensitivity of 1
  const scale = sensitivity / epsilon;
  
  // Generate Laplace noise
  const u = Math.random() - 0.5;
  const noise = -scale * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
  
  const perturbedValue = numericValue + noise;
  
  // Round to two decimal places
  return perturbedValue.toFixed(2);
}

/**
 * Anonymize a document with multiple fields
 */
export function anonymizeDocument<T extends Record<string, any>>(
  document: T,
  fieldConfigs: Record<string, { type: AnonymizationType; config?: AnonymizationConfig }>,
  deepSearch: boolean = false
): T {
  // Create a copy of the document
  const result: Record<string, any> = { ...document };
  
  // Apply anonymization to specified fields
  for (const field in fieldConfigs) {
    const { type, config } = fieldConfigs[field];
    
    // Handle nested fields using dot notation
    if (field.includes('.')) {
      const parts = field.split('.');
      let current: any = result;
      
      // Navigate to the nested field
      for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]]) {
          break;
        }
        current = current[parts[i]];
      }
      
      // Get the last part of the path
      const lastPart = parts[parts.length - 1];
      
      // Anonymize the field if it exists
      if (current && current[lastPart] !== undefined) {
        current[lastPart] = anonymizeValue(current[lastPart], type, config);
      }
    } else {
      // Direct field
      if (result[field] !== undefined) {
        result[field] = anonymizeValue(result[field], type, config);
      }
    }
  }
  
  // Optionally deep search for PII patterns
  if (deepSearch) {
    deepSearchAndAnonymize(result);
  }
  
  return result as T;
}

/**
 * Deep search for PII patterns and anonymize them
 */
function deepSearchAndAnonymize(obj: any): void {
  if (!obj || typeof obj !== 'object') {
    return;
  }
  
  // Recursively process arrays
  if (Array.isArray(obj)) {
    obj.forEach(item => deepSearchAndAnonymize(item));
    return;
  }
  
  // Process each field in the object
  for (const key in obj) {
    const value = obj[key];
    
    // Recursively process nested objects
    if (value && typeof value === 'object') {
      deepSearchAndAnonymize(value);
      continue;
    }
    
    // Check if the value is a string and might contain PII
    if (typeof value === 'string') {
      // Email pattern
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        obj[key] = anonymizeValue(value, AnonymizationType.PSEUDONYMIZATION);
        continue;
      }
      
      // Phone number pattern
      if (/^\+?[0-9\s\-\(\)]{7,15}$/.test(value)) {
        obj[key] = anonymizeValue(value, AnonymizationType.MASKING);
        continue;
      }
      
      // Credit card pattern
      if (/[0-9]{4}[\s\-]?[0-9]{4}[\s\-]?[0-9]{4}[\s\-]?[0-9]{4}/.test(value)) {
        obj[key] = anonymizeValue(value, AnonymizationType.MASKING);
        continue;
      }
      
      // SSN pattern
      if (/[0-9]{3}[\s\-]?[0-9]{2}[\s\-]?[0-9]{4}/.test(value)) {
        obj[key] = anonymizeValue(value, AnonymizationType.REDACTION);
        continue;
      }
      
      // Date of birth pattern
      if (/^\d{4}-\d{2}-\d{2}/.test(value) && key.toLowerCase().includes('birth')) {
        obj[key] = anonymizeValue(value, AnonymizationType.GENERALIZATION);
        continue;
      }
    }
  }
}

/**
 * Create a k-anonymous dataset
 * K-anonymity ensures that each combination of quasi-identifiers appears at least k times
 */
export function makeKAnonymous<T extends Record<string, any>>(
  dataset: T[],
  quasiIdentifiers: string[],
  k: number = 5
): T[] {
  // Group records by quasi-identifier values
  const groups: Map<string, T[]> = new Map();
  
  // Create groups based on quasi-identifiers
  for (const record of dataset) {
    // Create a key from the quasi-identifiers
    const key = quasiIdentifiers
      .map(field => {
        const value = getNestedValue(record, field);
        return value !== undefined ? value.toString() : '';
      })
      .join('|');
    
    // Add to existing group or create new group
    if (groups.has(key)) {
      groups.get(key)?.push({ ...record });
    } else {
      groups.set(key, [{ ...record }]);
    }
  }
  
  // Apply anonymization to groups smaller than k
  const anonymizedDataset: T[] = [];
  
  for (const [key, group] of groups.entries()) {
    if (group.length >= k) {
      // Group already has k or more records, add them unchanged
      anonymizedDataset.push(...group);
    } else {
      // Group has fewer than k records, generalize the quasi-identifiers
      const generalizedRecords = generalizeGroup(group, quasiIdentifiers);
      anonymizedDataset.push(...generalizedRecords);
    }
  }
  
  return anonymizedDataset;
}

/**
 * Generalize a group of records to make them more similar
 */
function generalizeGroup<T extends Record<string, any>>(
  group: T[],
  quasiIdentifiers: string[]
): T[] {
  // Create generalized versions of each quasi-identifier
  const generalizedValues: Record<string, string> = {};
  
  for (const field of quasiIdentifiers) {
    // Get all values for this field
    const values = group.map(record => getNestedValue(record, field));
    
    // Choose a generalization strategy based on the field and values
    if (values.every(v => typeof v === 'number' || (typeof v === 'string' && !isNaN(Number(v))))) {
      // Numeric values - create a range
      const numbers = values.map(v => typeof v === 'number' ? v : Number(v)).filter(v => !isNaN(v));
      const min = Math.min(...numbers);
      const max = Math.max(...numbers);
      generalizedValues[field] = `${min}-${max}`;
    } else if (values.every(v => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v.toString()))) {
      // Dates - keep only year and month
      const firstValue = values[0].toString();
      generalizedValues[field] = firstValue.substring(0, 7); // YYYY-MM
    } else {
      // Other types - use a generic value
      generalizedValues[field] = '[Generalized]';
    }
  }
  
  // Apply generalized values to all records
  return group.map(record => {
    const copy = { ...record };
    
    for (const field of quasiIdentifiers) {
      setNestedValue(copy, field, generalizedValues[field]);
    }
    
    return copy;
  });
}

/**
 * Get a nested value from an object using dot notation
 */
function getNestedValue(obj: any, path: string): any {
  const parts = path.split('.');
  let current = obj;
  
  for (const part of parts) {
    if (current === undefined || current === null) {
      return undefined;
    }
    current = current[part];
  }
  
  return current;
}

/**
 * Set a nested value in an object using dot notation
 */
function setNestedValue(obj: any, path: string, value: any): void {
  const parts = path.split('.');
  let current = obj;
  
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (current[part] === undefined) {
      current[part] = {};
    }
    current = current[part];
  }
  
  current[parts[parts.length - 1]] = value;
}

export default {
  AnonymizationType,
  initialize,
  anonymizeValue,
  anonymizeDocument,
  makeKAnonymous
};