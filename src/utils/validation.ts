import { logger } from './logger';

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class Validator {
  static validateBase64(base64String: string): void {
    try {
      if (!base64String) {
        throw new ValidationError('Base64 string is required');
      }

      // Check if it's a valid base64 string
      const regex = /^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)?$/;
      if (!regex.test(base64String)) {
        throw new ValidationError('Invalid base64 string format');
      }

      // Try to decode a small portion to verify it's valid
      Buffer.from(base64String.slice(0, 100), 'base64');
    } catch (error) {
      logger.error('Base64 validation error:', error);
      throw new ValidationError('Invalid base64 string');
    }
  }

  static validateEmail(email: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new ValidationError('Invalid email format');
    }
  }

  static validatePassword(password: string): void {
    if (!password || password.length < 8) {
      throw new ValidationError('Password must be at least 8 characters long');
    }

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
      throw new ValidationError(
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      );
    }
  }

  static validateName(name: string): void {
    if (!name || name.trim().length < 2) {
      throw new ValidationError('Name must be at least 2 characters long');
    }
  }

  static validateDocumentId(documentId: string): void {
    if (!documentId || !documentId.includes('/')) {
      throw new ValidationError('Invalid document ID format');
    }
  }

  static validateClaimId(claimId: string): void {
    if (!claimId || !claimId.includes('-')) {
      throw new ValidationError('Invalid claim ID format');
    }
  }

  static validateAuthRequest(body: any): void {
    if (!body.email || typeof body.email !== 'string') {
      throw new ValidationError('Email is required and must be a string');
    }

    if (!body.password || typeof body.password !== 'string') {
      throw new ValidationError('Password is required and must be a string');
    }

    this.validateEmail(body.email);
    this.validatePassword(body.password);
  }
}