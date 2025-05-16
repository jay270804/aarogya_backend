interface ApiResponse<T> {
  statusCode: number;
  body: string;
  headers: {
    [key: string]: string | boolean;
  };
}

export class ResponseFormatter {
  static success<T>(data: T, statusCode: number = 200): ApiResponse<T> {
    return {
      statusCode,
      body: JSON.stringify({
        success: true,
        data
      }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      }
    };
  }

  static error(message: string, statusCode: number = 400): ApiResponse<{ message: string }> {
    return {
      statusCode,
      body: JSON.stringify({
        success: false,
        error: {
          message
        }
      }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      }
    };
  }

  static unauthorized(message: string = 'Unauthorized'): ApiResponse<{ message: string }> {
    return this.error(message, 401);
  }

  static forbidden(message: string = 'Forbidden'): ApiResponse<{ message: string }> {
    return this.error(message, 403);
  }

  static notFound(message: string = 'Not Found'): ApiResponse<{ message: string }> {
    return this.error(message, 404);
  }

  static serverError(message: string = 'Internal Server Error'): ApiResponse<{ message: string }> {
    return this.error(message, 500);
  }
}