#!/usr/bin/env bun

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { config } from 'dotenv';

// Load environment variables
config();

const LAMBDA_FUNCTION_NAME = process.env.LAMBDA_FUNCTION_NAME || 'inbound-email-processor';
const AWS_REGION = process.env.AWS_REGION || 'us-east-2';
// Load CDK environment variables
config({ path: path.join(__dirname, '../aws/cdk/.env') });

const SERVICE_API_URL = process.env.SERVICE_API_URL || 'https://inbound.exon.dev';
const SERVICE_API_KEY = process.env.SERVICE_API_KEY || '';
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || 'inbound-email-processor-bucket';
const SENTRY_DSN = process.env.SENTRY_DSN || 'https://663ccebda453fcc61b3632c6fb3235c0@o4509397176745984.ingest.us.sentry.io/4509397177794560';
const NODE_OPTIONS = process.env.NODE_OPTIONS || '-r @sentry/aws-serverless/awslambda-auto';

console.log('🚀 Deploying Lambda function update...\n');

try {
  // Check if AWS CLI is installed
  try {
    execSync('aws --version', { stdio: 'ignore' });
  } catch {
    console.error('❌ AWS CLI is not installed. Please install it first.');
    process.exit(1);
  }

  // Check if Lambda function exists1`
  try {
    execSync(`aws lambda get-function --function-name ${LAMBDA_FUNCTION_NAME} --region ${AWS_REGION}`, { 
      stdio: 'ignore' 
    });
  } catch {
    console.error(`❌ Lambda function ${LAMBDA_FUNCTION_NAME} not found in region ${AWS_REGION}`);
    console.error('Please run "bun run deploy:cdk" first to create the infrastructure.');
    process.exit(1);
  }

  // Update environment variables first
  // Ask user to select environment
  console.log('🌍 Select deployment environment:');
  console.log('1. Development (dev)');
  console.log('2. Production (prod)');
  
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const environment = await new Promise<string>((resolve) => {
    rl.question('Enter your choice (1 or 2): ', (answer: string) => {
      rl.close();
      if (answer === '1' || answer.toLowerCase() === 'dev') {
        resolve('dev');
      } else if (answer === '2' || answer.toLowerCase() === 'prod') {
        resolve('prod');
      } else {
        console.log('Invalid choice, defaulting to development');
        resolve('dev');
      }
    });
  });
  
  // Set the appropriate API URL based on environment selection
  let SELECTED_SERVICE_API_URL: string;
  if (environment === 'prod') {
    SELECTED_SERVICE_API_URL = process.env.PROD_SERVICE_API_URL || '';
    console.log(`🚀 Deploying to PRODUCTION environment`);
  } else {
    SELECTED_SERVICE_API_URL = SERVICE_API_URL;
    console.log(`🛠️  Deploying to DEVELOPMENT environment`);
  }
  
  console.log('🔧 Updating Lambda environment variables...');
  
  if (!SELECTED_SERVICE_API_URL || !SERVICE_API_KEY) {
    console.warn('⚠️  Warning: SERVICE_API_URL or SERVICE_API_KEY not set in environment');
    console.warn('   Lambda will use default values or existing configuration');
  }
  
  const envVarsCommand = `aws lambda update-function-configuration \
    --function-name ${LAMBDA_FUNCTION_NAME} \
    --environment "Variables={SERVICE_API_URL=${SELECTED_SERVICE_API_URL},SERVICE_API_KEY=${SERVICE_API_KEY},S3_BUCKET_NAME=${S3_BUCKET_NAME},SENTRY_DSN=${SENTRY_DSN},NODE_OPTIONS=${NODE_OPTIONS}}" \
    --region ${AWS_REGION}`;
  
  try {
    const envResult = execSync(envVarsCommand, { encoding: 'utf-8' });
    const envResultJson = JSON.parse(envResult);
    console.log('✅ Environment variables updated');
    console.log(`   SERVICE_API_URL: ${envResultJson.Environment?.Variables?.SERVICE_API_URL || 'not set'}`);
    console.log(`   SERVICE_API_KEY: ${envResultJson.Environment?.Variables?.SERVICE_API_KEY ? '[HIDDEN]' : 'not set'}`);
    console.log(`   S3_BUCKET_NAME: ${envResultJson.Environment?.Variables?.S3_BUCKET_NAME || 'not set'}`);
    console.log(`   SENTRY_DSN: ${envResultJson.Environment?.Variables?.SENTRY_DSN || 'not set'}`);
    console.log(`   NODE_OPTIONS: ${envResultJson.Environment?.Variables?.NODE_OPTIONS || 'not set'}`);
    // Wait for the configuration update to complete
    console.log('\n⏳ Waiting for configuration update to complete...');
    execSync(`aws lambda wait function-updated --function-name ${LAMBDA_FUNCTION_NAME} --region ${AWS_REGION}`, {
      stdio: 'inherit'
    });
  } catch (error) {
    console.error('❌ Failed to update environment variables:', error instanceof Error ? error.message : String(error));
    console.error('   Continuing with code deployment...');
  }

  console.log(`\n📦 Preparing Lambda deployment package for ${LAMBDA_FUNCTION_NAME}...`);

  // Create a temporary directory for the deployment package
  const tempDir = path.join(process.cwd(), '.lambda-deploy-temp');
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true });
  }
  fs.mkdirSync(tempDir);

  // Copy the Lambda source file
  const lambdaSourcePath = path.join(process.cwd(), 'aws/cdk/lib/lambda/email-processor.js');
  const lambdaDestPath = path.join(tempDir, 'email-processor.js');
  
  if (!fs.existsSync(lambdaSourcePath)) {
    console.error(`❌ Lambda source file not found at ${lambdaSourcePath}`);
    process.exit(1);
  }
  
  fs.copyFileSync(lambdaSourcePath, lambdaDestPath);

  // Create package.json for dependencies
  const packageJson = {
    name: 'email-processor',
    version: '1.0.0',
    main: 'email-processor.js',
    dependencies: {
      '@aws-sdk/client-s3': '^3.817.0'
    }
  };
  
  fs.writeFileSync(
    path.join(tempDir, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );

  // Install dependencies
  console.log('📥 Installing Lambda dependencies...');
  execSync('npm install --production', { 
    cwd: tempDir,
    stdio: 'inherit'
  });

  // Create deployment package
  console.log('📦 Creating deployment package...');
  const zipPath = path.join(process.cwd(), 'lambda-deployment.zip');
  
  // Remove old zip if exists
  if (fs.existsSync(zipPath)) {
    fs.unlinkSync(zipPath);
  }
  
  // Create zip file
  execSync(`zip -r ${zipPath} .`, {
    cwd: tempDir,
    stdio: 'inherit'
  });

  // Update Lambda function code
  console.log(`\n☁️  Updating Lambda function ${LAMBDA_FUNCTION_NAME}...`);
  
  const updateCommand = `aws lambda update-function-code \
    --function-name ${LAMBDA_FUNCTION_NAME} \
    --zip-file fileb://${zipPath} \
    --region ${AWS_REGION}`;
  
  const result = execSync(updateCommand, { encoding: 'utf-8' });
  
  // Parse the result to show key information
  const resultJson = JSON.parse(result);
  
  console.log('\n✅ Lambda function updated successfully!');
  console.log(`   Function: ${resultJson.FunctionName}`);
  console.log(`   Runtime: ${resultJson.Runtime}`);
  console.log(`   Last Modified: ${resultJson.LastModified}`);
  console.log(`   Code Size: ${(resultJson.CodeSize / 1024 / 1024).toFixed(2)} MB`);
  
  // Show current environment variables
  if (resultJson.Environment?.Variables) {
    console.log('\n📋 Current Environment Variables:');
    console.log(`   SERVICE_API_URL: ${resultJson.Environment.Variables.SERVICE_API_URL || 'not set'}`);
    console.log(`   SERVICE_API_KEY: ${resultJson.Environment.Variables.SERVICE_API_KEY ? '[HIDDEN]' : 'not set'}`);
  }

  // Cleanup
  console.log('\n🧹 Cleaning up temporary files...');
  fs.rmSync(tempDir, { recursive: true });
  fs.unlinkSync(zipPath);

  console.log('\n🎉 Lambda deployment complete!');
  console.log('\n📝 Note: This updates both the Lambda function code and environment variables.');
  console.log('   To update infrastructure, use "bun run deploy:cdk"');

} catch (error) {
  console.error('\n❌ Deployment failed:', error instanceof Error ? error.message : String(error));
  
  // Cleanup on error
  const tempDir = path.join(process.cwd(), '.lambda-deploy-temp');
  const zipPath = path.join(process.cwd(), 'lambda-deployment.zip');
  
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true });
  }
  if (fs.existsSync(zipPath)) {
    fs.unlinkSync(zipPath);
  }
  
  process.exit(1);
} 