import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcrypt';

// Create mock BEFORE any imports
const mockSql = vi.fn();
global.mockSql = mockSql;

// Set test environment
process.env.NODE_ENV = 'test';

// Now import authService
import * as authService from '../../src/services/authService.js';

describe('AuthService - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('register', () => {
    it('should create a new user with hashed password', async () => {
      const email = 'test@example.com';
      const password = 'password123';

      mockSql.mockResolvedValueOnce([
        { id: 1, email, created_at: new Date() }
      ]);

      const user = await authService.register(email, password);

      expect(user).toHaveProperty('id');
      expect(user.email).toBe(email);
      expect(mockSql).toHaveBeenCalledTimes(1);
    });

    it('should throw error if user already exists (23505 duplicate key)', async () => {
      const duplicateError = new Error('duplicate key value');
      duplicateError.code = '23505';
      mockSql.mockRejectedValueOnce(duplicateError);

      await expect(
        authService.register('existing@example.com', 'password123')
      ).rejects.toThrow();
    });

    it('should throw error if password is too short', async () => {
      await expect(
        authService.register('test@example.com', '123')
      ).rejects.toThrow('Password must be at least 6 characters');
    });

    it('should throw error if email or password is missing', async () => {
      await expect(
        authService.register('', 'password123')
      ).rejects.toThrow('Email and password required');

      await expect(
        authService.register('test@example.com', '')
      ).rejects.toThrow('Email and password required');
    });
  });

  describe('login', () => {
    it('should return token and user for valid credentials', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      mockSql.mockResolvedValueOnce([{
        id: 1,
        email: 'test@example.com',
        password_hash: hashedPassword
      }]);

      const result = await authService.login('test@example.com', 'password123');

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe('test@example.com');
      expect(mockSql).toHaveBeenCalledTimes(1);
    });

    it('should throw error for invalid email', async () => {
      mockSql.mockResolvedValueOnce([]);

      await expect(
        authService.login('wrong@example.com', 'password123')
      ).rejects.toThrow('Invalid credentials');
    });

    it('should throw error for invalid password', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      mockSql.mockResolvedValueOnce([{
        id: 1,
        email: 'test@example.com',
        password_hash: hashedPassword
      }]);

      await expect(
        authService.login('test@example.com', 'wrongpassword')
      ).rejects.toThrow('Invalid credentials');
    });

    it('should throw error if email or password is missing', async () => {
      await expect(
        authService.login('', 'password123')
      ).rejects.toThrow('Email and password required');

      await expect(
        authService.login('test@example.com', '')
      ).rejects.toThrow('Email and password required');
    });
  });

  describe('getUserById', () => {
    it('should return user by id', async () => {
      mockSql.mockResolvedValueOnce([{
        id: 1,
        email: 'test@example.com'
      }]);

      const user = await authService.getUserById(1);

      expect(user).toHaveProperty('id', 1);
      expect(user).toHaveProperty('email', 'test@example.com');
      expect(mockSql).toHaveBeenCalledTimes(1);
    });

    it('should return undefined if user not found', async () => {
      mockSql.mockResolvedValueOnce([]);

      const user = await authService.getUserById(999);

      expect(user).toBeUndefined();
    });
  });
});