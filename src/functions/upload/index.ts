import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DocumentService } from '../../services/documentService';
import { ClaimService } from '../../services/claimService';
import { AIService } from '../../services/aiService';
import { ResponseFormatter } from '../../utils/responseFormatter';
import { Validator } from '../../utils/validation';

const documentService = new DocumentService();
const claimService = new ClaimService();
const aiService = new AIService();

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return ResponseFormatter.error('Request body is required');
    }

    const { document } = JSON.parse(event.body);
    if (!document) {
      return ResponseFormatter.error('Document is required');
    }

    // Validate base64 string
    Validator.validateBase64(document);

    // Get user ID from authorizer context
    const userId = event.requestContext.authorizer?.claims.email;
    if (!userId) {
      return ResponseFormatter.unauthorized();
    }

    // Upload document to S3
    const documentId = await documentService.uploadDocument(document, userId);

    // Process document with AI
    const extractedData = await aiService.processDocument(document);

    // Create claim
    const claim = await claimService.createClaim(userId, documentId, extractedData);

    return ResponseFormatter.success({
      claimId: claim.id,
      documentId,
      status: claim.status
    });
  } catch (error) {
    if (error instanceof Error) {
      return ResponseFormatter.error(error.message);
    }
    return ResponseFormatter.serverError();
  }
};