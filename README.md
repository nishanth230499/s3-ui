# s3-ui

A user-friendly portal for accessing and managing S3 buckets. This application provides enhanced functionality, such as uploading / downloading objects, creating presigned URLs and zipping objects, beyond what the official AWS S3 console offers.

## Features

1. **Browse and Manage Objects**

   - Users can view objects stored in any folder within an S3 bucket.
   - Objects can also be uploaded directly to the bucket through the portal.

2. **Multi-Bucket Configuration**

   - Configure multiple S3 buckets and use a global dropdown to switch between them seamlessly.

3. **Presigned URLs**

   - Generate multiple presigned URLs simultaneously to download or share objects securely.

4. **Zipping Objects**

   - Select multiple objects to zip into a single file. This feature is not available in the official S3 console.
   - The zipping progress is tracked and displayed to the user, even after refreshing the page.

## Technologies Used

- **Backend**: Python, Flask, Boto3
- **Frontend**: JavaScript, React
- **AWS Services**: S3, Lambda, DynamoDB

## Implementation Details

- **Backend Communication with AWS**

  - The backend communicates securely with S3 using a secret access key.

- **Zipping Implementation**
  - A Lambda function is used for zipping selected objects.
  - The resulting zip file is stored back in the S3 bucket.
  - Progress is updated in AWS DynamoDB, allowing users to track the status through the portal.

## Steps to Setup

- Pull the repository.
- Install all the dependencies for the lambda function by running `npm i` in `lambda-functions/s3-zip` directory. Deploy the lambda function by zipping all the contents of the folder and uploading it to the lambda function.
- Make sure the above IAM role associated with the lambda function has the following permission policy and map respective ARNs.

```
s3:ListBucket (on the bucket)

s3:GetObject
s3:PutObject
s3:PutObjectTagging (on every object in the bucket)

dynamodb:PutItem
dynamodb:GetItem
dynamodb:UpdateItem (on the zip progress dynamoDB table)
```

- Go to `server` directory and place the firebase service account credentials in the file named `s3_ui_2024_cred.json`.
- Create an `.env` file inside the `server` directory with the contents in the following format. Make sure you place the whole `AWS_SECRETS` in a single line. Multiple bucket names can be added, but make sure you add all the below mentioned fields for all the buckets.

```
AWS_SECRETS={
    "<bucket-name>": {
        "S3_REGION": "<bucket-region>",
        "AWS_ACCESS_KEY_ID": "<user-access-key-id>",
        "AWS_SECRET_ACCESS_KEY": "<user-secret-access-key>",
        "ZIP_LAMBDA_FUNCTION_NAME": "<zip-lambda-function-name>",
        "ZIP_PROGRESS_DYNAMO_DB_TABLE_NAME": "<zip-progress-dynamo-db-table-name>"
    }
    ...
}
```

- Make sure the above IAM user has the following permission policy and map respective ARNs.

```
s3:GetObject (on every object in the bucket)
s3:ListBucket (on the bucket)
lambda:InvokeFunction (on the zip lambda function)
dynamodb:GetItem (on the zip progress dynamoDB table)
dynamodb:Query (on all the indices of the zip progress dynamoDB table)
```

- Install the backend dependencies by running `pip3 install -r requirements.txt` in the `server` directory.
- Install the frontend dependencies by running `npm i` in the `web-client` directory.

## Steps to Run

1. Make sure the lambda function is active.
2. Run the backend server by running `python3 run.py` in `server` directory.
3. Run the frontend by running `npm start` in the `web-client` directory.
