declare module '@otplib/preset-default' {
  export const authenticator: {
    generateSecret: () => string;
    keyuri: (username: string, appName: string, secret: string) => string;
    verify: (options: { token: string; secret: string }) => boolean;
  };
}

declare module '@otplib/core' {
  // Define types as needed
}

// Extend the express-session declaration
declare module 'express-session' {
  interface Session {
    twoFactorAuth?: {
      userId: number;
      username: string;
      remember?: boolean;
      twoFactorPending: boolean;
    };
    twoFactorSetup?: {
      secret: string;
      backupCodes: string[];
    };
  }
}

// Error handling typings
declare global {
  interface Error {
    status?: number;
    code?: string;
  }
}