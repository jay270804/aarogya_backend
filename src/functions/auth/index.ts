import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { AuthService } from '../../services/authService';
import { ResponseFormatter } from '../../utils/responseFormatter';
import { Validator } from '../../utils/validation';
import { logger } from '../../utils/logger';

const authService = new AuthService();

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        logger.info('Processing auth request', { path: event.path });

        if (!event.body) {
            return ResponseFormatter.error('Request body is required');
        }

        const requestBody = JSON.parse(event.body);

        // Route based on path
        if (event.path === '/auth/register') {
            try {
                Validator.validateAuthRequest(requestBody);
                const { email, password, name } = requestBody;
                const result = await authService.register(email, password, name);
                return ResponseFormatter.success(result);
            } catch (error: any) {
                return ResponseFormatter.error(error.message);
            }
        }
        else if (event.path === '/auth/login') {
            try {
                Validator.validateAuthRequest(requestBody);
                const { email, password } = requestBody;
                const result = await authService.login(email, password);
                return ResponseFormatter.success(result);
            } catch (error: any) {
                return ResponseFormatter.error(error.message);
            }
        }

        return ResponseFormatter.error('Invalid endpoint');
    } catch (error) {
        logger.error('Error in auth handler', { error });
        return ResponseFormatter.error('Internal server error');
    }
};