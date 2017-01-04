#!/bin/bash

# Check if the AWS CLI is in the PATH
found=$(which aws)
if [ -z "$found" ]; then
  echo "Please install the AWS CLI under your PATH: http://aws.amazon.com/cli/"
  exit 1
fi

# Check if jq is in the PATH
found=$(which jq)
if [ -z "$found" ]; then
  echo "Please install jq under your PATH: http://stedolan.github.io/jq/"
  exit 1
fi

# Read other configuration from config.json
cliProfile=$(jq -er '.cliProfile' config.json)
if [[ $? == 0 ]]; then
  echo "Setting session CLI profile to $cliProfile"
  export AWS_DEFAULT_PROFILE=$cliProfile
fi
region=$(jq -r '.region' config.json)
appName=$(jq -r '.appName' config.json)
appNameLowerCase=$(echo "$appName" | tr '[:upper:]' '[:lower:]')
bucketName=$appNameLowerCase.$(jq -r '.bucket' config.json)
awsAccountNumber=$(jq -r '.awsAccountNumber' config.json)


# Verifying the bucket name is Valid
if  [[ "$bucketName" =~ [^a-z0-9\.\-] ]]; then
  echo "Invalid bucket name $bucketName"
  exit 1
fi
# Verifying the bucket does not exists already
if !(aws s3 ls "s3://$bucketName" 2>&1 | grep -q 'NoSuchBucket')
then
  echo "Bucket $bucketName alerady exists, please update config.json and try again"
  exit 1
fi

scriptDir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
scriptDir="file://${scriptDir//////}//cloudformation//simpleApp.json"

echo Creating Cognito User pool
userPoolId=`aws cognito-idp create-user-pool --pool-name ${appName}UserPool --auto-verified-attributes email --admin-create-user-config AllowAdminCreateUserOnly=true --schema  '[{"Name":"name","Required":true}, {"Name":"email","Required":true}]' | jq -r '.UserPool.Id'`
userPoolArn="arn:aws:cognito-idp:$region:$awsAccountNumber:userpool/$userPoolId"
userPoolClientId=$(aws cognito-idp create-user-pool-client --user-pool-id $userPoolId --client-name ${appName} | jq -r '.UserPoolClient.ClientId')
echo "Created User Pool ${appName}UserPool with ARN $userPoolArn and client ID $userPoolClientId"

echo
echo Creating Cognito Identity Pool
identityPoolId=`aws cognito-identity create-identity-pool --identity-pool-name ${appName}IdPool --no-allow-unauthenticated-identities --cognito-identity-providers ProviderName=cognito-idp.$region.amazonaws.com/$userPoolId,ClientId=$userPoolClientId | jq -r '.IdentityPoolId'`
echo "Created Identity Pool Id ${appName}IdPool with ID $identityPoolId"

# Create S3 Bucket
echo
echo Creating cloudformation stack $appName in $region to create:
echo "   - S3 bucket $bucketName"
#TODO Add role names as stack parameters
aws cloudformation create-stack \
    --capabilities CAPABILITY_NAMED_IAM \
    --stack-name $appName \
    --template-body $scriptDir \
    --parameters ParameterKey=BucketNameParam,ParameterValue=$bucketName \
                 ParameterKey=CognidoIdentityPoolIdParam,ParameterValue=$identityPoolId \
                 ParameterKey=CognidoUserPoolArnParam,ParameterValue=$userPoolArn \
    --region $region
#TODO handle errors

echo "Waiting for the stack to complete creation, this can take a while"
sleep 5

aws cloudformation wait stack-create-complete \
    --stack-name $appName \
    --region $region

#TODO handle errors

echo
echo Associating Identity Pool with IAM Roles
# TODO - get the roles from cloudformation outputs
aws cognito-identity set-identity-pool-roles --identity-pool-id $identityPoolId --roles authenticated=arn:aws:iam::546190104433:role/SimpleAuthAppBasicUserRole --role-mappings "{\"cognito-idp.$region.amazonaws.com/$userPoolId:$userPoolClientId\": {\"Type\" : \"Token\", \"AmbiguousRoleResolution\": \"AuthenticatedRole\" } }"
exit

echo "Stack now fully created"

#./deploy.sh
