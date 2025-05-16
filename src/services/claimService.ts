import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { logger } from '../utils/logger';

interface Claim {
  id: string;
  userId: string;
  documentId: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  extractedData: any;
  createdAt: string;
  updatedAt: string;
}

export class ClaimService {
  private docClient: DynamoDBDocumentClient;
  private tableName: string;

  constructor() {
    const client = new DynamoDBClient({});
    this.docClient = DynamoDBDocumentClient.from(client);
    this.tableName = process.env.CLAIMS_TABLE || '';
  }

  async createClaim(userId: string, documentId: string, extractedData: any): Promise<Claim> {
    try {
      const timestamp = new Date().toISOString();
      const claim: Claim = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId,
        documentId,
        status: 'PENDING',
        extractedData,
        createdAt: timestamp,
        updatedAt: timestamp
      };

      await this.docClient.send(new PutCommand({
        TableName: this.tableName,
        Item: claim
      }));

      return claim;
    } catch (error) {
      logger.error('Error creating claim:', error);
      throw new Error('Failed to create claim');
    }
  }

  async getClaimById(id: string): Promise<Claim | null> {
    try {
      const result = await this.docClient.send(new GetCommand({
        TableName: this.tableName,
        Key: { id }
      }));

      return result.Item as Claim || null;
    } catch (error) {
      logger.error('Error getting claim by ID:', error);
      throw new Error('Failed to get claim');
    }
  }

  async getClaimsByUserId(userId: string): Promise<Claim[]> {
    try {
      const result = await this.docClient.send(new QueryCommand({
        TableName: this.tableName,
        IndexName: 'UserIdIndex',
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId
        }
      }));

      return result.Items as Claim[] || [];
    } catch (error) {
      logger.error('Error getting claims by user ID:', error);
      throw new Error('Failed to get claims');
    }
  }

  async updateClaimStatus(id: string, status: Claim['status'], extractedData?: any): Promise<Claim> {
    try {
      const claim = await this.getClaimById(id);
      if (!claim) {
        throw new Error('Claim not found');
      }

      const updatedClaim: Claim = {
        ...claim,
        status,
        extractedData: extractedData || claim.extractedData,
        updatedAt: new Date().toISOString()
      };

      await this.docClient.send(new PutCommand({
        TableName: this.tableName,
        Item: updatedClaim
      }));

      return updatedClaim;
    } catch (error) {
      logger.error('Error updating claim status:', error);
      throw new Error('Failed to update claim status');
    }
  }
}