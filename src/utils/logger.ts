import { Logger } from '@aws-lambda-powertools/logger';

export const logger = new Logger({
  serviceName: 'medical-claims-service',
  logLevel: process.env.LOG_LEVEL || 'INFO',
});