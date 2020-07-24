# faas

# Serverless computing of Lambda Function

Lambda Function Definition

Usage:

1. index.js file has lambda function which gets invoked by sns source topic 
2. circleCI build gets triggers when the lambda function gets updated and pushed to the github faas repository
3. CircleCi build zips the updated lambda function and places it in S3 bucket for the latest lambda function deployment(lambda function update)
4. Lambda function is written in Nodejs with ses to trigger the mails to the recipients 