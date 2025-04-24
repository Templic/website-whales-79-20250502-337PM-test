// Session extensions to fix TypeScript errors
declare module 'express-session' {
  interface SessionData {
    // Auto-generated properties
    userId: any;
    destroy: any;
    twoFactorSetup: any;
    twoFactorAuth: any;
    csrf: any;
    id: any;
    cookie: any;
    securityContext: any;
    mfa: any;
    user: any;
    csrfToken: string;
    lastActivity: Date;
    analytics: any;
  }
}