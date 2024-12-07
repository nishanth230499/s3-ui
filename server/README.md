# s3-ui/server

## Steps to setup

- Pull the repository.
- Place the firebase service account credentials in the file named `s3_ui_2024_cred.json`.
- Deploy the lambda function in the folder `lambda-functions/s3-zip`. Instructions for that can be found in the `README.md` on the same folder.
- Create an `.env` file inside the `server` folder with the contents in the following format. Make sure you add the whole `AWS_SECRETS` in a single line.

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
```
