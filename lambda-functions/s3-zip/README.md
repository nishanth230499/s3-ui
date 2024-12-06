# s3-zip

## Steps to setup

- Deploy the lambda function by zipping all the contents in the folder and uploading it to the lambda function.
- Make sure the above IAM role associated with the lambda function has the following permission policy and map respective ARNs.

```
s3:ListBucket (on the bucket)

s3:GetObject
s3:PutObject
s3:PutObjectTagging (on every object in the bucket)
```
