# Aarogya Backend - AI-Powered Medical Claims Processing System

This project contains a serverless application built with AWS SAM for processing medical claims using AI. It includes automated document processing, user authentication, and secure document storage.

## Project Structure
src/
├── functions/ # Lambda function handlers
│ ├── auth/ # Authentication handlers
│ ├── claims/ # Claims management handlers
│ ├── documents/ # Document management handlers
│ └── upload/ # Document upload & processing
├── services/ # Business logic services
│ ├── aiService.ts # Gemini AI integration
│ ├── authService.ts # Authentication service
│ ├── claimService.ts # Claims management
│ └── documentService.ts # S3 operations
└── utils/ # Shared utilities
├── logger.ts # Logging utility
├── validation.ts # Input validation
└── responseFormatter.ts # API response formatting

## API Endpoints

- **Authentication**
  - POST `/auth/register` - Register new user
  - POST `/auth/login` - User login

- **Documents**
  - POST `/documents` - Upload and process medical document
  - GET `/documents/{id}/url` - Get document presigned URL

- **Claims**
  - GET `/claims` - List user's claims
  - GET `/claims/{id}` - Get specific claim details

## Prerequisites

* SAM CLI - [Install the SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html)
* Node.js - [Install Node.js 18 or higher](https://nodejs.org/en/)
* Docker - [Install Docker community edition](https://hub.docker.com/search/?type=edition&offering=community)

## Environment Variables

Create a `.env` file with the following variables:
```env
JWT_SECRET=your_jwt_secret_here
GEMINI_API_KEY=your_gemini_api_key_here
```

## Deploy the Application

1. Build the application:
```bash
sam build
```

2. Deploy to AWS:
```bash
sam deploy --guided
```

You'll be prompted for:
* Stack Name (e.g., aarogya-backend)
* AWS Region
* Environment variables confirmation
* IAM role creation confirmation

## Local Development

1. Install dependencies:
```bash
npm install
```

2. Run API locally:
```bash
sam local start-api
```

3. Test a specific function:
```bash
sam local invoke FunctionName --event events/event.json
```

## Features

- **AI-Powered Document Processing**
  - Uses Google's Gemini AI for document analysis
  - Extracts key information from medical documents
  - Supports multiple document formats

- **Secure Authentication**
  - JWT-based authentication
  - Password hashing
  - Role-based access control

- **Document Management**
  - Secure S3 storage
  - Presigned URLs for secure access
  - Document ownership validation

- **Claims Processing**
  - Automated claim creation
  - User-specific claim access
  - Claim status tracking

## Architecture

- **AWS Services Used**
  - Lambda for serverless compute
  - API Gateway for REST API
  - DynamoDB for data storage
  - S3 for document storage
  - IAM for security policies

## Security

- JWT authentication
- CORS configuration
- Input validation
- Document access control
- Secure password handling

## Cleanup

To delete the deployed application:
```bash
sam delete --stack-name aarogya-backend
```

## Resources

- [AWS SAM Documentation](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/what-is-sam.html)
- [Google Gemini AI Documentation](https://ai.google.dev/)
- [AWS Lambda Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)