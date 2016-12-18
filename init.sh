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
ddbTable=$appName$(jq -r '.ddbTable' config.json)


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


# Create S3 Bucket
echo Creating cloudformation stack $appName in $region to create:
echo "   - S3 bucket $bucketName"
echo "   - DynamoDB table $ddbTable"
aws cloudformation create-stack \
    --stack-name $appName \
    --template-body $scriptDir \
    --parameters ParameterKey=BucketNameParam,ParameterValue=$bucketName \
                 ParameterKey=DDBTableName,ParameterValue=$ddbTable \
    --region $region
#TODO handle errors

echo "Waiting for the stack to complete creation, this can take a while"
sleep 5

aws cloudformation wait stack-create-complete \
    --stack-name $appName \
    --region $region

#TODO handle errors

echo "Stack now fully created"

#./deploy.sh
