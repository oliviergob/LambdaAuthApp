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


echo "Sync www content with S3 bucket $bucketName begin..."
cd www
aws s3 sync . s3://$bucketName --acl public-read
cd ..
echo "Sync www content with S3 bucket $bucketName end"

cd functions

# Updating Lambda Functions
for f in $(ls -1); do
  echo "Updating function $f begin..."
  cd $f
  node-lambda -f deploy.env deploy
  cd ..
  echo "Updating function $f end"
done

cd ..
