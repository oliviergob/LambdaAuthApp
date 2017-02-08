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
adminEmail=$(jq -r '.adminEmail' config.json)
adminTempPassword=$(jq -r '.adminTempPassword' config.json)

# Getting the account number for later user
awsAccountNumber=`aws sts get-caller-identity --output text --query 'Account'`


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
userPoolId=`aws cognito-idp create-user-pool \
                --pool-name ${appName}UserPool \
                --auto-verified-attributes email \
                --admin-create-user-config AllowAdminCreateUserOnly=true \
                --schema  '[{"Name":"name","Required":true}, {"Name":"email","Required":true}]' | jq -r '.UserPool.Id'`
userPoolArn="arn:aws:cognito-idp:$region:$awsAccountNumber:userpool/$userPoolId"
userPoolClientId=$(aws cognito-idp create-user-pool-client \
                       --user-pool-id $userPoolId \
                       --client-name ${appName} | jq -r '.UserPoolClient.ClientId')
echo "Created User Pool ${appName}UserPool with ARN $userPoolArn and client ID $userPoolClientId"

echo
echo Creating Cognito Identity Pool
identityPoolId=`aws cognito-identity create-identity-pool \
                    --identity-pool-name ${appName}IdPool \
                    --no-allow-unauthenticated-identities \
                    --cognito-identity-providers ProviderName=cognito-idp.$region.amazonaws.com/$userPoolId,ClientId=$userPoolClientId | jq -r '.IdentityPoolId'`
echo "Created Identity Pool Id ${appName}IdPool with ID $identityPoolId"

echo
echo Creating config file www/js/config.js

sed  -e "s/IDPOOL/$identityPoolId/g" templates/config.js.template | \
     sed  -e "s/USERPOOLID/$userPoolId/g" | \
     sed  -e "s/USERPOOLCLIENT/$userPoolClientId/g" | \
     sed  -e "s/AWSREGION/$region/g" > www/js/config.js

# Create S3 Bucket
echo
echo Creating cloudformation stack $appName in $region to create:
echo "   - S3 bucket $bucketName for static website hosting"
echo "   - S3 bucket $bucketName.lambda for deploying lambda fuction code"
echo "   - IAM Role SimpleAuthAppLambdaExecutionRole"
echo "   - IAM Role SimpleAuthAppAdminRole"
echo "   - IAM Role SimpleAuthAppBasicUserRole"
echo "   - Lambda Function basicDataAccess"
echo "   - Lambda Function adminDataAccess"
#TODO Add role names as stack parameters
aws cloudformation create-stack \
    --capabilities CAPABILITY_NAMED_IAM \
    --stack-name $appName \
    --template-body $scriptDir \
    --parameters ParameterKey=BucketNameParam,ParameterValue=$bucketName \
                 ParameterKey=CognidoIdentityPoolIdParam,ParameterValue=$identityPoolId \
                 ParameterKey=CognidoUserPoolArnParam,ParameterValue=$userPoolArn \
    --region $region >/dev/null
#TODO handle errors

echo "Waiting for the stack to complete creation, this can take a while"
sleep 5

aws cloudformation wait stack-create-complete \
    --stack-name $appName \
    --region $region

if [[ $? != 0 ]]; then
  echo "Login to cloudformation front end and have a look at the event logs"
  exit 1
fi

echo "Cloudformation Stack now fully created"

stackOutput=`aws cloudformation describe-stacks \
    --stack-name $appName \
    --region $region | jq -r '.Stacks[0].Outputs[] | .OutputKey +"="+ .OutputValue'`

eval $stackOutput

echo
echo Associating Identity Pool with IAM Roles
aws cognito-identity set-identity-pool-roles --identity-pool-id $identityPoolId --roles authenticated=$BasicUserRoleArn --role-mappings "{\"cognito-idp.$region.amazonaws.com/$userPoolId:$userPoolClientId\": {\"Type\" : \"Token\", \"AmbiguousRoleResolution\": \"AuthenticatedRole\" } }"

echo
echo Creating Admin Group
 aws cognito-idp create-group \
      --user-pool-id $userPoolId \
      --group-name AdminGroup \
      --role-arn $AdminRoleArn > /dev/null

echo
echo Creating Admin user
aws cognito-idp admin-create-user \
    --user-pool-id $userPoolId \
    --username admin \
    --temporary-password $adminTempPassword \
    --user-attributes Name=email,Value=$adminEmail > /dev/null

aws cognito-idp admin-add-user-to-group \
     --user-pool-id $userPoolId \
     --username admin \
     --group-name AdminGroup > /dev/null



 exit



#./deploy.sh
