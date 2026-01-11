import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js'; // Your Express app
import sql from '../../src/db/database.js';

describe('Auth API - Integration Tests', () => {
  const testUser = {
    email: `test-${Date.now()}@example.com`, // Unique email each run
    password: 'testpass123',
  };

  // Clean up before each test
  beforeEach(async () => {
    await sql`DELETE FROM users WHERE email LIKE 'test-%@example.com'`;
  });

  // Clean up after all tests
  afterAll(async () => {
    await sql`DELETE FROM users WHERE email LIKE 'test-%@example.com'`;
    await sql.end();
  });

  describe('POST /auth/register', () => {
    it('should register a new user successfully', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send(testUser)
        .expect(201);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body.user).toHaveProperty('email', testUser.email);
      expect(res.body.user).toHaveProperty('id');
      expect(res.body.user).not.toHaveProperty('password_hash');
    });

    it('should return 400 if email is missing', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({ password: 'password123' })
        .expect(400);

      expect(res.body).toHaveProperty('error');
    });

    it('should return 400 if password is too short', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({ email: testUser.email, password: '123' })
        .expect(400);

      expect(res.body.error).toContain('at least 6 characters');
    });

    it('should return 409 if user already exists', async () => {
      // Register once
      await request(app)
        .post('/auth/register')
        .send(testUser);

      // Try to register again
      const res = await request(app)
        .post('/auth/register')
        .send(testUser)
        .expect(409);

      expect(res.body.error).toContain('already exists');
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      // Create a user before each login test
      await request(app)
        .post('/auth/register')
        .send(testUser);
    });

    it('should login successfully with valid credentials', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send(testUser)
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toHaveProperty('email', testUser.email);
      
      // Check cookie is set
      expect(res.headers['set-cookie']).toBeDefined();
      const cookie = res.headers['set-cookie'][0];
      expect(cookie).toContain('access_token');
    });

    it('should return 401 for invalid email', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'wrong@example.com', password: testUser.password })
        .expect(401);

      expect(res.body.error).toContain('Invalid credentials');
    });

    it('should return 401 for invalid password', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ email: testUser.email, password: 'wrongpassword' })
        .expect(401);

      expect(res.body.error).toContain('Invalid credentials');
    });

    it('should return 400 if email or password is missing', async () => {
      await request(app)
        .post('/auth/login')
        .send({ email: testUser.email })
        .expect(400);

      await request(app)
        .post('/auth/login')
        .send({ password: testUser.password })
        .expect(400);
    });
  });

  describe('GET /auth/me', () => {
    let authToken;

    beforeEach(async () => {
      // Register and login to get token
      await request(app)
        .post('/auth/register')
        .send(testUser);

      const loginRes = await request(app)
        .post('/auth/login')
        .send(testUser);

      authToken = loginRes.body.token;
    });

    it('should return user data with valid token', async () => {
      const res = await request(app)
        .get('/auth/me')
        .set('Cookie', [`access_token=${authToken}`])
        .expect(200);

      expect(res.body).toHaveProperty('email', testUser.email);
      expect(res.body).toHaveProperty('id');
    });

    it('should return 401 without token', async () => {
      const res = await request(app)
        .get('/auth/me')
        .expect(401);

      expect(res.body.error).toContain('Missing token');
    });

    it('should return 401 with invalid token', async () => {
      const res = await request(app)
        .get('/auth/me')
        .set('Cookie', ['access_token=invalid-token-here'])
        .expect(401);

      expect(res.body.error).toContain('Invalid or expired token');
    });
  });

  describe('POST /auth/logout', () => {
    let authToken;

    beforeEach(async () => {
      await request(app)
        .post('/auth/register')
        .send(testUser);

      const loginRes = await request(app)
        .post('/auth/login')
        .send(testUser);

      authToken = loginRes.body.token;
    });

    it('should clear cookie and logout successfully', async () => {
      const res = await request(app)
        .post('/auth/logout')
        .set('Cookie', [`access_token=${authToken}`])
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
      
      // Check cookie is cleared
      const cookie = res.headers['set-cookie'][0];
      expect(cookie).toContain('access_token=;');
    });
  });
});