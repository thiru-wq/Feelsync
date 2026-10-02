# FeelSync Backend — AWS Lambda + Amazon Bedrock

This backend provides the AI companion API for FeelSync, connecting the frontend to Amazon Bedrock (Claude) for conversational responses.

## Architecture

```
Frontend (React)
  → API Gateway (HTTP API)
  → Lambda (this code)
  → Amazon Bedrock (Claude)
```

## Prerequisites

- AWS account with access to Amazon Bedrock
- Bedrock model access enabled for Claude (Anthropic)
- Node.js 18+ for Lambda runtime

## Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Build the Lambda

```bash
npm run build
```

Or create a deployment bundle:

```bash
npx esbuild lambda/chat.ts --bundle --platform=node --target=node20 --format=esm --outfile=dist/index.mjs --external:@aws-sdk/*
```

### 3. Deploy to AWS

#### Option A: Using AWS Console

1. Create a new Lambda function:
   - Runtime: Node.js 20.x
   - Architecture: x86_64 or arm64
   - Handler: `index.handler` (if using bundled output)

2. Set environment variables:
   ```
   BEDROCK_MODEL_ID=anthropic.claude-haiku-4-5-20250805-v1:0
   ```
   (Or use Claude 3.5 Sonnet: `anthropic.claude-3-5-sonnet-20241022-v2:0`)

3. Upload the deployment bundle

4. Ensure the Lambda execution role has permission to invoke Bedrock:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": ["bedrock:InvokeModel"],
         "Resource": "arn:aws:bedrock:*::foundation-model/*"
       }
     ]
   }
   ```

#### Option B: Using AWS SAM

Create a `template.yaml`:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Description: FeelSync AI Backend

Globals:
  Function:
    Runtime: nodejs20.x
    Architecture: arm64
    Environment:
      Variables:
        BEDROCK_MODEL_ID: anthropic.claude-haiku-4-5-20250805-v1:0

Resources:
  ChatFunction:
    Type: AWS::Serverless::Function
    Properties:
      Handler: index.handler
      CodeUri: dist/
      Events:
        ChatApi:
          Type: HttpApi
          Properties:
            Path: /chat
            Method: POST
      Policies:
        - Statement:
            Effect: Allow
            Action: bedrock:InvokeModel
            Resource: arn:aws:bedrock:*::foundation-model/*

Outputs:
  ApiUrl:
    Description: HTTP API endpoint
    Value: !Sub 'https://${ServerlessHttpApi}.execute-api.${AWS::Region}.amazonaws.com'
```

Deploy:
```bash
sam deploy --guided
```

### 4. Configure Frontend

Copy the API Gateway URL and add to your frontend `.env`:

```env
VITE_API_BASE_URL=https://your-api-id.execute-api.region.amazonaws.com
```

## API Specification

### POST /chat

Request:
```json
{
  "message": "I'm feeling a bit anxious today.",
  "currentMood": "low",
  "conversationHistory": [
    { "role": "user", "content": "Hello!" },
    { "role": "assistant", "content": "Hi there! How can I help?" }
  ]
}
```

Response:
```json
{
  "reply": "I hear you — anxiety can feel really overwhelming..."
}
```

### CORS

The Lambda includes CORS headers for all responses. Configure API Gateway to allow CORS if needed.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `BEDROCK_MODEL_ID` | Bedrock model identifier | `anthropic.claude-haiku-4-5-20250805-v1:0` |

## Model Options

- **Claude Haiku 4.5** (fast, cost-effective, recommended): `anthropic.claude-haiku-4-5-20250805-v1:0`
- **Claude Sonnet 4** (more capable): `anthropic.claude-sonnet-4-20250514-v1:0`

## Monitoring

View Lambda logs in CloudWatch Logs:
```bash
aws logs tail /aws/lambda/your-function-name --follow
```

## Security Notes

- Never commit AWS credentials to the repository
- Use IAM roles for Lambda permissions (not access keys)
- Restrict API Gateway access if needed (e.g., Cognito authorizer, IP allowlist)
- Consider enabling AWS WAF for API protection

## Local Testing

You can test the Lambda locally using the AWS SAM CLI:

```bash
sam local invoke ChatFunction -e test-event.json
```

Where `test-event.json`:
```json
{
  "httpMethod": "POST",
  "body": "{\"message\":\"I'm feeling stressed\",\"currentMood\":\"low\"}"
}
```
