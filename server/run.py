from flask import Flask, request, make_response, abort
import os
import json
import boto3
import firebase_admin
from firebase_admin import credentials, db
from flask_cors import CORS
from datetime import timedelta
from flask_jwt_extended import JWTManager, create_access_token, create_refresh_token, jwt_required, get_jwt_identity
from jsonschema import validate
from bcrypt import checkpw, gensalt, hashpw
from dotenv import load_dotenv

from constants import PASSWORD_SCHEMA, ZIP_FILENAME_SCHEMA

cred = credentials.Certificate("./s3_ui_2024_cred.json")
firebase_admin.initialize_app(cred, {
    'databaseURL': 'https://s3-ui-2024-default-rtdb.asia-southeast1.firebasedatabase.app/'
})

load_dotenv()

app = Flask(__name__, static_url_path='')
CORS(app)

app.config["JWT_SECRET_KEY"] = "5e12b3e1bf11cc00aab03ffaf4e0bceb26268afc73d4a4760243488865680e73"
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=1)
app.config["JWT_REFRESH_TOKEN_EXPIRES"] = timedelta(days=30)
jwt = JWTManager(app)

aws_secrets = json.loads(os.getenv("AWS_SECRETS"))
aws_buckets = list(aws_secrets.keys())
s3_clients = {k: boto3.client('s3', 
                            region_name=v['S3_REGION'],
                            aws_access_key_id=v['AWS_ACCESS_KEY_ID'],
                            aws_secret_access_key=v['AWS_SECRET_ACCESS_KEY']) for k, v in aws_secrets.items()}

lambda_clients = {k: boto3.client('lambda', 
                            region_name=v['S3_REGION'],
                            aws_access_key_id=v['AWS_ACCESS_KEY_ID'],
                            aws_secret_access_key=v['AWS_SECRET_ACCESS_KEY']) for k, v in aws_secrets.items()}

def fetch_user(identity):
    ref = db.reference('/users/' + identity)
    return ref.get()

def get_user_response(user):
    new_user_dict = {
        "email": user['email'],
        "name": user['name'],
        "active": user['active'],
        "change_password": user['change_password'],
        "aws_buckets": aws_buckets
    }
    return new_user_dict

@app.route('/api/login', methods=["POST"])
def login():
    if request.method == "POST":   
        rq = request.json

        ref = db.reference('/users').order_by_child('email').equal_to(rq['email'])
        user = ref.get()

        if list(user.items()):
            (user_id, user) = list(user.items())[0]

            if user and user['active'] and checkpw(rq['password'].encode('utf-8'), user['password'].encode('utf-8')):
                res_user = get_user_response(user)

                access_token = create_access_token(identity=user_id, additional_claims=res_user)
                refresh_token = create_refresh_token(identity=user_id, additional_claims=res_user)
                
                return {
                    "tokens": {
                        "access_token": access_token,
                        "refresh_token": refresh_token
                    },
                    "user": res_user
                }
        return make_response({"message": "No user found"}, 401)

@app.route('/api/refresh', methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    if request.method == "POST":
        identity = get_jwt_identity()
        user = fetch_user(identity)
        if user['active']:
            res_user = get_user_response(user)
            access_token = create_access_token(identity=identity, additional_claims=res_user)
            return {"tokens": { "access_token": access_token }, "user": res_user}
        return make_response({"message": "Inactive User"}, 401)

# TODO: Revoke all previous tokens as soon as the password is changed
@app.route('/api/change-password', methods=["POST"])
@jwt_required()
def change_password():
    identity = get_jwt_identity()
    user = fetch_user(identity)
    if user['active']:
        rq = request.json
        schema = {
            "type": "object",
            "properties": {
                "current_password": {
                    "type": "string",
                },
                "new_password": PASSWORD_SCHEMA,
            },
            "required": ["current_password", "new_password"]
        }
        try:
            validate(instance=rq, schema=schema)
        except Exception as e:
            return make_response({"message": str(e)}, 403)
        
        if rq["new_password"] == rq["current_password"]:
            return make_response({"message": "Current and New Passwords cannot be same!"}, 403)

        if checkpw(rq['current_password'].encode('utf-8'), user['password'].encode('utf-8')):
            ref = db.reference('/users/' + identity)
            salt = gensalt()
            password_salt = hashpw(rq["new_password"].encode('utf-8'), salt).decode('utf-8')

            ref.update({"password": password_salt, "change_password": False})
            return {"message": "Password Changed successfully! Please login again with new credentials"}
        return make_response({"message": "Incorrect Password!"}, 403)
    abort(404)

@app.route('/api/list-files-folders/<bucket>/')
@app.route('/api/list-files-folders/<bucket>/<path:folder>')
@jwt_required()
def list_files_folders(bucket, folder=""):
    try:
        response = s3_clients[bucket].list_objects_v2(Bucket=bucket, Prefix=folder, Delimiter='/')
        return {'files': list(filter(lambda a: a["Key"] != folder, response.get('Contents', []))), 'folders': response.get('CommonPrefixes', [])}
    except Exception as e:
            return make_response({"message": str(e)}, 403)

@app.route('/api/get-presigned-urls/<bucket>/', methods=["POST"])
@jwt_required()
def get_presigned_urls(bucket):
    rq = request.json
    schema = {
        "type": "object",
        "properties": {
            "keys": {
                "type": "array",
                "items": {
                    "type": "string"
                },
                "minItems": 1,
            },
            "expires_in": {
                "type": "number",
                "multipleOf" : 1,
                "minimum": 1,
                "maximum": 604800
            }
        },
        "required": ["keys", "expires_in"]
    }
    try:
        validate(instance=rq, schema=schema)
    except Exception as e:
        return make_response({"message": str(e)}, 403)
    
    try:
        response = []
        for key in rq["keys"]:
            url = s3_clients[bucket].generate_presigned_url(
                ClientMethod='get_object',
                Params={
                    'Bucket': bucket,
                    'Key': key
                },
                ExpiresIn=rq["expires_in"]
            )
            response.append({"key": key, "url": url})
        return {"presigned_urls": response}
    except Exception as e:
        return make_response({"message": str(e)}, 403)

@app.route('/api/zip-files/<bucket>/', methods=["POST"])
@jwt_required()
def zip_files(bucket):
    rq = request.json
    schema = {
        "type": "object",
        "properties": {
            "folder": {
                "type": "string",
            },
            "prefixes": {
                "type": "array",
                "items": {
                    "type": "string"
                },
                "minItems": 1,
            },
            "zip_file_name": ZIP_FILENAME_SCHEMA
        },
        "required": ["folder", "prefixes", "zip_file_name"]
    }
    try:
        validate(instance=rq, schema=schema)
    except Exception as e:
        return make_response({"message": str(e)}, 403)
    
    try:
        lambda_invoke_payload = {
            "bucket": bucket,
            "folder": rq["folder"],
            "prefixes": rq["prefixes"],
            "zipFileName": rq["zip_file_name"],
            "region": aws_secrets[bucket]["S3_REGION"]
        }
        lambda_response = lambda_clients[bucket].invoke(
            FunctionName = aws_secrets[bucket]["ZIP_LAMBDA_FUNCTION_NAME"],
            InvocationType = 'Event',
            Payload = json.dumps(lambda_invoke_payload)
        )
        if lambda_response['StatusCode'] == 202:
            return {"message": "Zip request sent!"}
        else:
            return make_response({"Lambda Invoke Failed": str(e)}, lambda_response['StatusCode'])
    except Exception as e:
        return make_response({"message": str(e)}, 403)

@app.route('/')
def home():
    return app.send_static_file('index.html')

if __name__ == '__main__':
    app.debug = True
    app.run(host='0.0.0.0', port=5000)
