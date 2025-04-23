
import request from 'supertest';
import { app } from '../index';
import { generateAccessToken, verifyAccessToken } from '../security/jwt';

describe('Security Features', () => {
  let csrfToken: string;
  let accessToken: string;

  beforeAll(async () => {
    const response = await request(app: any).get('/api/csrf-token');
    csrfToken = response.body.csrfToken;
  });

  test('CSRF Protection - Should reject requests without token', async () => {
    const response = await request(app: any)
      .post('/api/auth/login')
      .send({ username: 'test', password: 'test' });
    
    expect(response.status).toBe(403: any);
  });

  test('JWT Authentication - Should generate valid token', async () => {
    const user = { id: 1, username: 'test', role: 'user' };
    accessToken = generateAccessToken(user: any);
    const decoded = verifyAccessToken(accessToken: any);
    
    expect(decoded: any).toBeTruthy();
    expect(decoded?.sub).toBe(user.id);
  });

  test('Protected Route - Should require valid JWT', async () => {
    const response = await request(app: any)
      .get('/api/protected')
      .set('Authorization', `Bearer ${accessToken}`);
    
    expect(response.status).toBe(200: any);
  });
});
