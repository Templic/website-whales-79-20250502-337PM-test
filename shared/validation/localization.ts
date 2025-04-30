/**
 * Localization Module
 * 
 * This module provides internationalization support for validation error messages,
 * allowing for context-aware messaging and custom templates.
 */

import { ValidationError, ValidationContext, ValidationSeverity } from './validationTypes';
import OpenAI from 'openai';

/**
 * Locale identifier
 */
export type Locale = string;

/**
 * Message template with placeholders
 */
export type MessageTemplate = string;

/**
 * Localized message bundle
 */
export interface LocalizedMessages {
  [key: string]: MessageTemplate;
}

/**
 * Localization provider interface
 */
export interface LocalizationProvider {
  /**
   * Get a localized message
   */
  getMessage(key: string, locale: Locale, params?: Record<string, any>): string;
  
  /**
   * Localize a validation error
   */
  localizeError(error: ValidationError, locale: Locale): ValidationError;
  
  /**
   * Localize multiple validation errors
   */
  localizeErrors(errors: ValidationError[], locale: Locale): ValidationError[];
  
  /**
   * Get all available locales
   */
  getAvailableLocales(): Locale[];
  
  /**
   * Check if a locale is supported
   */
  isLocaleSupported(locale: Locale): boolean;
}

/**
 * Simple localization provider using message bundles
 */
export class MessageBundleProvider implements LocalizationProvider {
  private bundles: Map<Locale, LocalizedMessages>;
  private fallbackLocale: Locale;
  
  constructor(fallbackLocale: Locale = 'en') {
    this.bundles = new Map();
    this.fallbackLocale = fallbackLocale;
    
    // Initialize fallback locale with empty bundle
    this.bundles.set(fallbackLocale, {});
  }
  
  /**
   * Register a localized message bundle
   */
  registerBundle(locale: Locale, messages: LocalizedMessages): void {
    this.bundles.set(locale, {
      ...this.bundles.get(locale),
      ...messages
    });
  }
  
  /**
   * Get a localized message
   */
  getMessage(key: string, locale: Locale, params: Record<string, any> = {}): string {
    // Get the message bundle for the locale, or fall back
    const bundle = this.bundles.get(locale) || this.bundles.get(this.fallbackLocale) || {};
    
    // Get the message template
    const template = bundle[key] || key;
    
    // Replace placeholders with values
    return this.formatTemplate(template, params);
  }
  
  /**
   * Format a template with parameters
   */
  private formatTemplate(template: string, params: Record<string, any>): string {
    return template.replace(/\{(\w+)\}/g, (_, key) => {
      return params[key] !== undefined ? String(params[key]) : `{${key}}`;
    });
  }
  
  /**
   * Localize a validation error
   */
  localizeError(error: ValidationError, locale: Locale): ValidationError {
    // If the error has a message code, look up the localized message
    if (error.code) {
      const params = {
        field: this.localizeFieldName(error.field, locale),
        value: error.value,
        ...this.getParamsFromError(error)
      };
      
      const localizedMessage = this.getMessage(`validation.${error.code}`, locale, params);
      
      return {
        ...error,
        message: localizedMessage,
        field: this.localizeFieldName(error.field, locale)
      };
    }
    
    // Otherwise, just return the original error
    return {
      ...error,
      field: this.localizeFieldName(error.field, locale)
    };
  }
  
  /**
   * Localize multiple validation errors
   */
  localizeErrors(errors: ValidationError[], locale: Locale): ValidationError[] {
    return errors.map(error => this.localizeError(error, locale));
  }
  
  /**
   * Localize a field name
   */
  private localizeFieldName(field: string, locale: Locale): string {
    // Look up the localized field name
    const localizedField = this.getMessage(`field.${field}`, locale);
    
    // If no localization exists, format the field name
    if (localizedField === `field.${field}`) {
      return field
        .split('.')
        .map(part => this.capitalizeFirstLetter(part))
        .join(' ');
    }
    
    return localizedField;
  }
  
  /**
   * Extract params from an error
   */
  private getParamsFromError(error: ValidationError): Record<string, any> {
    // Try to extract parameters from the error code
    // For example, "min_length" with value=2 becomes { min: 2 }
    const params: Record<string, any> = {};
    
    // Handle common validation codes
    if (error.code.startsWith('min_length') || error.code.startsWith('max_length')) {
      const match = error.message.match(/(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        
        if (error.code.startsWith('min')) {
          params.min = num;
        } else {
          params.max = num;
        }
      }
    }
    
    return params;
  }
  
  /**
   * Capitalize the first letter of a string
   */
  private capitalizeFirstLetter(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
  
  /**
   * Get all available locales
   */
  getAvailableLocales(): Locale[] {
    return Array.from(this.bundles.keys());
  }
  
  /**
   * Check if a locale is supported
   */
  isLocaleSupported(locale: Locale): boolean {
    return this.bundles.has(locale);
  }
}

/**
 * OpenAI-powered localization provider for advanced translations
 */
export class AILocalizationProvider implements LocalizationProvider {
  private openai: OpenAI;
  private fallbackProvider: LocalizationProvider;
  private supportedLocales: Set<Locale>;
  private cachedTranslations: Map<string, Map<Locale, string>>;
  
  constructor(
    apiKey: string,
    fallbackProvider: LocalizationProvider,
    supportedLocales: Locale[] = ['en', 'es', 'fr', 'de', 'ja', 'zh', 'ko', 'ru', 'pt', 'it']
  ) {
    this.openai = new OpenAI({ apiKey });
    this.fallbackProvider = fallbackProvider;
    this.supportedLocales = new Set(supportedLocales);
    this.cachedTranslations = new Map();
  }
  
  /**
   * Get a localized message
   */
  async getMessage(key: string, locale: Locale, params: Record<string, any> = {}): Promise<string> {
    // If not a supported locale, fall back
    if (!this.isLocaleSupported(locale)) {
      return this.fallbackProvider.getMessage(key, locale, params);
    }
    
    // Create a cache key
    const cacheKey = JSON.stringify({ key, params });
    
    // Check cache
    if (this.cachedTranslations.has(cacheKey)) {
      const translations = this.cachedTranslations.get(cacheKey)!;
      
      if (translations.has(locale)) {
        return translations.get(locale)!;
      }
    }
    
    // Get the message in English
    const englishMessage = this.fallbackProvider.getMessage(key, 'en', params);
    
    // Generate the field name and message parts for replacement
    const fieldName = params.field || '';
    const contextInfo = this.generateContextInfo(key, params);
    
    // For English, just return the fallback message
    if (locale === 'en') {
      return englishMessage;
    }
    
    try {
      // Use OpenAI to translate the message
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: `You are a professional translator who specializes in localizing validation error messages for forms and data entry. 
            I will provide you with an English validation error message, and I need you to translate it into ${locale} language.
            Maintain the tone and formatting of the original message. Keep the translation concise and clear.
            If there are placeholders like numbers or field names, maintain those in the same position in your translation.
            Respond with ONLY the translated text, nothing else.`
          },
          {
            role: "user",
            content: `Translate this validation error message into ${locale}:
            
            Message: "${englishMessage}"
            
            Field name: "${fieldName}"
            
            Additional context: ${contextInfo}
            
            Only respond with the translated text in ${locale}, nothing else.`
          }
        ],
        temperature: 0.2, // Low temperature for more consistent translations
      });
      
      const translatedMessage = response.choices[0].message.content?.trim() || englishMessage;
      
      // Cache the translation
      if (!this.cachedTranslations.has(cacheKey)) {
        this.cachedTranslations.set(cacheKey, new Map());
      }
      
      this.cachedTranslations.get(cacheKey)!.set(locale, translatedMessage);
      
      return translatedMessage;
    } catch (error) {
      console.error('AI translation error:', error);
      
      // Fall back to the original provider
      return this.fallbackProvider.getMessage(key, locale, params);
    }
  }
  
  /**
   * Generate context information for the translation
   */
  private generateContextInfo(key: string, params: Record<string, any>): string {
    // Extract the validation type from the key
    const validationType = key.split('.').pop() || '';
    
    let context = '';
    
    // Add context based on validation type
    switch (validationType) {
      case 'required':
        context = 'This is a required field error';
        break;
      case 'min_length':
        context = `This is a minimum length error. The field must be at least ${params.min} characters`;
        break;
      case 'max_length':
        context = `This is a maximum length error. The field must not exceed ${params.max} characters`;
        break;
      case 'email':
        context = 'This is an invalid email format error';
        break;
      case 'pattern':
        context = 'This is a pattern matching error';
        break;
      default:
        context = 'This is a validation error message';
        break;
    }
    
    return context;
  }
  
  /**
   * Localize a validation error
   */
  async localizeError(error: ValidationError, locale: Locale): Promise<ValidationError> {
    // If not a supported locale, fall back
    if (!this.isLocaleSupported(locale)) {
      return this.fallbackProvider.localizeError(error, locale);
    }
    
    // Prepare parameters
    const params = {
      field: error.field,
      value: error.value,
    };
    
    // Get localized message
    const localizedMessage = await this.getMessage(`validation.${error.code}`, locale, params);
    
    // Create localized error
    return {
      ...error,
      message: localizedMessage
    };
  }
  
  /**
   * Localize multiple validation errors
   */
  async localizeErrors(errors: ValidationError[], locale: Locale): Promise<ValidationError[]> {
    // If not a supported locale, fall back
    if (!this.isLocaleSupported(locale)) {
      return this.fallbackProvider.localizeErrors(errors, locale);
    }
    
    // Localize each error
    const localizedErrors = await Promise.all(
      errors.map(error => this.localizeError(error, locale))
    );
    
    return localizedErrors;
  }
  
  /**
   * Get all available locales
   */
  getAvailableLocales(): Locale[] {
    return Array.from(this.supportedLocales);
  }
  
  /**
   * Check if a locale is supported
   */
  isLocaleSupported(locale: Locale): boolean {
    return this.supportedLocales.has(locale);
  }
}

/**
 * Create default localized message bundles
 */
export function createDefaultMessageBundles(): Record<Locale, LocalizedMessages> {
  return {
    'en': {
      'validation.required': '{field} is required',
      'validation.min_length': '{field} must be at least {min} characters',
      'validation.max_length': '{field} cannot exceed {max} characters',
      'validation.email': '{field} must be a valid email address',
      'validation.pattern': '{field} has an invalid format',
      'validation.match': '{field} does not match',
      'validation.number': '{field} must be a number',
      'validation.min': '{field} must be at least {min}',
      'validation.max': '{field} cannot exceed {max}',
      'validation.integer': '{field} must be an integer',
      'validation.positive': '{field} must be positive',
      'validation.negative': '{field} must be negative',
      'validation.date': '{field} must be a valid date',
      'validation.future_date': '{field} must be in the future',
      'validation.past_date': '{field} must be in the past',
      'validation.url': '{field} must be a valid URL',
      'validation.boolean': '{field} must be true or false',
      'validation.one_of': '{field} must be one of the allowed values',
      'validation.not_one_of': '{field} cannot be one of the forbidden values',
      'validation.credit_card': '{field} must be a valid credit card number',
      'validation.uuid': '{field} must be a valid UUID',
      'validation.alpha': '{field} can only contain letters',
      'validation.alphanumeric': '{field} can only contain letters and numbers',
      'validation.zipcode': '{field} must be a valid zip code',
      'validation.phone': '{field} must be a valid phone number',
      'validation.password': '{field} must meet the password requirements',
      'validation.custom': '{field} is invalid',
      
      // Field names
      'field.firstName': 'First Name',
      'field.lastName': 'Last Name',
      'field.email': 'Email Address',
      'field.password': 'Password',
      'field.confirmPassword': 'Confirm Password',
      'field.phoneNumber': 'Phone Number',
      'field.address': 'Address',
      'field.city': 'City',
      'field.state': 'State',
      'field.zipCode': 'Zip Code',
      'field.country': 'Country',
      'field.birthDate': 'Birth Date',
      'field.age': 'Age',
      'field.gender': 'Gender',
      'field.username': 'Username',
      'field.bio': 'Bio',
      'field.website': 'Website',
      'field.company': 'Company',
      'field.title': 'Title',
      'field.description': 'Description',
      'field.price': 'Price',
      'field.quantity': 'Quantity',
      'field.tags': 'Tags',
      'field.category': 'Category',
      'field.comments': 'Comments',
      'field.rating': 'Rating',
      'field.status': 'Status'
    },
    
    'es': {
      'validation.required': '{field} es obligatorio',
      'validation.min_length': '{field} debe tener al menos {min} caracteres',
      'validation.max_length': '{field} no puede exceder {max} caracteres',
      'validation.email': '{field} debe ser una dirección de correo válida',
      'validation.pattern': '{field} tiene un formato inválido',
      'validation.match': '{field} no coincide',
      'validation.number': '{field} debe ser un número',
      'validation.min': '{field} debe ser al menos {min}',
      'validation.max': '{field} no puede exceder {max}',
      'validation.integer': '{field} debe ser un número entero',
      'validation.positive': '{field} debe ser positivo',
      'validation.negative': '{field} debe ser negativo',
      'validation.date': '{field} debe ser una fecha válida',
      'validation.future_date': '{field} debe ser en el futuro',
      'validation.past_date': '{field} debe ser en el pasado',
      'validation.url': '{field} debe ser una URL válida',
      'validation.boolean': '{field} debe ser verdadero o falso',
      'validation.custom': '{field} no es válido',
      
      // Field names
      'field.firstName': 'Nombre',
      'field.lastName': 'Apellido',
      'field.email': 'Correo electrónico',
      'field.password': 'Contraseña',
      'field.confirmPassword': 'Confirmar contraseña',
      'field.phoneNumber': 'Número de teléfono',
      'field.address': 'Dirección',
      'field.city': 'Ciudad',
      'field.state': 'Estado',
      'field.zipCode': 'Código postal',
      'field.country': 'País',
      'field.birthDate': 'Fecha de nacimiento',
      'field.age': 'Edad',
      'field.gender': 'Género'
    },
    
    'fr': {
      'validation.required': '{field} est requis',
      'validation.min_length': '{field} doit comporter au moins {min} caractères',
      'validation.max_length': '{field} ne peut pas dépasser {max} caractères',
      'validation.email': '{field} doit être une adresse e-mail valide',
      'validation.pattern': '{field} a un format invalide',
      'validation.match': '{field} ne correspond pas',
      'validation.number': '{field} doit être un nombre',
      'validation.min': '{field} doit être au moins {min}',
      'validation.max': '{field} ne peut pas dépasser {max}',
      'validation.integer': '{field} doit être un nombre entier',
      'validation.positive': '{field} doit être positif',
      'validation.negative': '{field} doit être négatif',
      'validation.date': '{field} doit être une date valide',
      'validation.future_date': '{field} doit être dans le futur',
      'validation.past_date': '{field} doit être dans le passé',
      'validation.url': '{field} doit être une URL valide',
      'validation.boolean': '{field} doit être vrai ou faux',
      'validation.custom': '{field} n\'est pas valide',
      
      // Field names
      'field.firstName': 'Prénom',
      'field.lastName': 'Nom de famille',
      'field.email': 'Adresse e-mail',
      'field.password': 'Mot de passe',
      'field.confirmPassword': 'Confirmer le mot de passe',
      'field.phoneNumber': 'Numéro de téléphone',
      'field.address': 'Adresse',
      'field.city': 'Ville',
      'field.state': 'État',
      'field.zipCode': 'Code postal',
      'field.country': 'Pays',
      'field.birthDate': 'Date de naissance',
      'field.age': 'Âge',
      'field.gender': 'Genre'
    }
  };
}

/**
 * Create a localization provider with default message bundles
 */
export function createLocalizationProvider(openAiApiKey?: string): LocalizationProvider {
  // Create the message bundle provider
  const bundleProvider = new MessageBundleProvider('en');
  
  // Register default message bundles
  const bundles = createDefaultMessageBundles();
  
  Object.entries(bundles).forEach(([locale, messages]) => {
    bundleProvider.registerBundle(locale, messages);
  });
  
  // If OpenAI API key is provided, create an AI provider
  if (openAiApiKey) {
    return new AILocalizationProvider(openAiApiKey, bundleProvider);
  }
  
  return bundleProvider;
}