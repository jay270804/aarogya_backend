import { APIGatewayTokenAuthorizerEvent, APIGatewayAuthorizerResult } from 'aws-lambda';
import { AuthService } from '../../services/authService';
import { logger } from '../../utils/logger';

const authService = new AuthService();

export const handler = async (event: APIGatewayTokenAuthorizerEvent): Promise<APIGatewayAuthorizerResult> => {
    try {
        logger.info('Processing authorization request', { type: event.type });

        if (!event.authorizationToken) {
            throw new Error('No authorization token provided');
        }

        // Remove 'Bearer ' prefix if present
        const token = event.authorizationToken.replace('Bearer ', '');

        // Verify the token
        const user = await authService.verifyToken(token);

        // Generate policy
        return {
            principalId: user.id,
            policyDocument: {
                Version: '2012-10-17',
                Statement: [
                    {
                        Action: 'execute-api:Invoke',
                        Effect: 'Allow',
                        Resource: event.methodArn
                    }
                ]
            },
            context: {
                userId: user.id,
                email: user.email
            }
        };
    } catch (error) {
        logger.error('Authorization failed', { error });
        throw new Error('Unauthorized');
    }
};