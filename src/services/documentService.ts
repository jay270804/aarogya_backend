import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { logger } from '../utils/logger';

export class DocumentService {
  private s3Client: S3Client;
  private bucketName: string;

  constructor() {
    this.s3Client = new S3Client({});
    this.bucketName = process.env.DOCUMENTS_BUCKET || '';
  }

  async uploadDocument(base64String: string, userId: string): Promise<string> {
    try {
      const documentId = `${userId}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const buffer = Buffer.from(base64String, 'base64');

      await this.s3Client.send(new PutObjectCommand({
        Bucket: this.bucketName,
        Key: documentId,
        Body: buffer,
        ContentType: 'application/octet-stream'
      }));

      return documentId;
    } catch (error) {
      logger.error('Error uploading document:', error);
      throw new Error('Failed to upload document');
    }
  }

  async getPresignedUrl(documentId: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: documentId
      });

      return await getSignedUrl(this.s3Client, command, { expiresIn });
    } catch (error) {
      logger.error('Error generating presigned URL:', error);
      throw new Error('Failed to generate presigned URL');
    }
  }

  async getDocument(documentId: string): Promise<Buffer> {
    try {
      const response = await this.s3Client.send(new GetObjectCommand({
        Bucket: this.bucketName,
        Key: documentId
      }));

      if (!response.Body) {
        throw new Error('Document not found');
      }

      return Buffer.from(await response.Body.transformToByteArray());
    } catch (error) {
      logger.error('Error retrieving document:', error);
      throw new Error('Failed to retrieve document');
    }
  }
}