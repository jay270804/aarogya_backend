import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { sign, verify } from 'jsonwebtoken';
import { hash, compare } from 'bcryptjs';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export class AuthService {
  private docClient: DynamoDBDocumentClient;
  private tableName: string;
  private jwtSecret: string;

  constructor() {
    const client = new DynamoDBClient({});
    this.docClient = DynamoDBDocumentClient.from(client);
    this.tableName = process.env.USERS_TABLE || '';
    this.jwtSecret = process.env.JWT_SECRET || '';

    if (!this.tableName || !this.jwtSecret) {
      throw new Error('Required environment variables are not set');
    }
  }

  async register(email: string, password: string, name: string): Promise<{ token: string }> {
    try {
      // Check if user already exists
      const existingUser = await this.getUserByEmail(email);
      if (existingUser) {
        throw new Error('User already exists');
      }

      // Hash password
      const hashedPassword = await hash(password, 10);
      const now = new Date().toISOString();

      // Create user
      const user: User = {
        id: uuidv4(),
        email,
        password: hashedPassword,
        name,
        createdAt: now,
        updatedAt: now
      };

      await this.docClient.send(new PutCommand({
        TableName: this.tableName,
        Item: user
      }));

      // Generate JWT token with user ID
      const token = this.generateToken(user.id, email);

      return { token };
    } catch (error) {
      logger.error('Error registering user:', error);
      throw error;
    }
  }

  async login(email: string, password: string): Promise<{ token: string }> {
    try {
      const user = await this.getUserByEmail(email);
      if (!user) {
        throw new Error('User not found');
      }

      const isValidPassword = await compare(password, user.password);
      if (!isValidPassword) {
        throw new Error('Invalid password');
      }

      const token = this.generateToken(user.id, email);
      return { token };
    } catch (error) {
      logger.error('Error logging in:', error);
      throw error;
    }
  }

  async verifyToken(token: string): Promise<{ id: string; email: string }> {
    try {
      const decoded = verify(token, this.jwtSecret) as { id: string; email: string };
      return decoded;
    } catch (error) {
      logger.error('Error verifying token:', error);
      throw new Error('Invalid token');
    }
  }

  private async getUserByEmail(email: string): Promise<User | null> {
    try {
      const result = await this.docClient.send(new QueryCommand({
        TableName: this.tableName,
        IndexName: 'EmailIndex',
        KeyConditionExpression: 'email = :email',
        ExpressionAttributeValues: {
          ':email': email
        }
      }));

      return result.Items?.[0] as User || null;
    } catch (error) {
      logger.error('Error getting user by email:', error);
      throw new Error('Failed to get user');
    }
  }

  private generateToken(userId: string, email: string): string {
    return sign({ id: userId, email }, this.jwtSecret, { expiresIn: '24h' });
  }
}