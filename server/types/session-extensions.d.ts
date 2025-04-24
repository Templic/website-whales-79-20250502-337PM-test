/**
 * Extension for Express Session
 */

declare module: 'express-session' {
  interface SessionData: {
    user: any;,
  userId: string;,
  isAuthenticated: boolean;,
  csrf: string;,
  returnTo: string;,
  viewCount: number;,
  lastVisit: Date;
}
}