import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DocumentService } from '../../services/documentService';
import { ClaimService } from '../../services/claimService';
import { ResponseFormatter } from '../../utils/responseFormatter';
import { Validator } from '../../utils/validation';

const documentService = new DocumentService();
const claimService = new ClaimService();

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Get user ID from authorizer context
    const userId = event.requestContext.authorizer?.claims.email;
    if (!userId) {
      return ResponseFormatter.unauthorized();
    }

    // Get document ID from path parameters
    const documentId = event.pathParameters?.id;
    if (!documentId) {
      return ResponseFormatter.error('Document ID is required');
    }

    // Validate document ID
    Validator.validateDocumentId(documentId);

    // Get claim associated with document
    const claims = await claimService.getClaimsByUserId(userId);
    const claim = claims.find(c => c.documentId === documentId);
    if (!claim) {
      return ResponseFormatter.forbidden();
    }

    // Generate pre-signed URL
    const presignedUrl = await documentService.getPresignedUrl(documentId);

    return ResponseFormatter.success({
      url: presignedUrl,
      expiresIn: 3600 // 1 hour
    });
  } catch (error) {
    if (error instanceof Error) {
      return ResponseFormatter.error(error.message);
    }
    return ResponseFormatter.serverError();
  }
};