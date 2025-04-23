
import { logSecurityEvent } from '../lib/security';

interface JWTAuthResponse {
  token: string;
  refreshToken: string;
}

export const authHelper = {
  async login(username: string, password: string): Promise<JWTAuthResponse> {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content || ''
      },
      body: JSON.stringify({ username, password })
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    return response.json();
  },

  setTokens(tokens: JWTAuthResponse) {
    sessionStorage.setItem('accessToken', tokens.token);
    sessionStorage.setItem('refreshToken', tokens.refreshToken);
  },

  getAccessToken(): string | null {
    return sessionStorage.getItem('accessToken');
  },

  clearTokens() {
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');
  }
};
