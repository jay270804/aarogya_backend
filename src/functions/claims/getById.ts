import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ClaimService } from '../../services/claimService';
import { ResponseFormatter } from '../../utils/responseFormatter';
import { Validator } from '../../utils/validation';

const claimService = new ClaimService();

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Get user ID from authorizer context
    const userId = event.requestContext.authorizer?.claims.email;
    if (!userId) {
      return ResponseFormatter.unauthorized();
    }

    // Get claim ID from path parameters
    const claimId = event.pathParameters?.id;
    if (!claimId) {
      return ResponseFormatter.error('Claim ID is required');
    }

    // Validate claim ID
    Validator.validateClaimId(claimId);

    // Get claim
    const claim = await claimService.getClaimById(claimId);
    if (!claim) {
      return ResponseFormatter.notFound('Claim not found');
    }

    // Check if user owns the claim
    if (claim.userId !== userId) {
      return ResponseFormatter.forbidden();
    }

    return ResponseFormatter.success(claim);
  } catch (error) {
    if (error instanceof Error) {
      return ResponseFormatter.error(error.message);
    }
    return ResponseFormatter.serverError();
  }
};