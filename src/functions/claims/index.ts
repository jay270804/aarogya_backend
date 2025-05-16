import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ClaimService } from '../../services/claimService';
import { ResponseFormatter } from '../../utils/responseFormatter';

const claimService = new ClaimService();

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Get user ID from authorizer context
    const userId = event.requestContext.authorizer?.claims.email;
    if (!userId) {
      return ResponseFormatter.unauthorized();
    }

    // Get claims for user
    const claims = await claimService.getClaimsByUserId(userId);

    return ResponseFormatter.success(claims);
  } catch (error) {
    if (error instanceof Error) {
      return ResponseFormatter.error(error.message);
    }
    return ResponseFormatter.serverError();
  }
};