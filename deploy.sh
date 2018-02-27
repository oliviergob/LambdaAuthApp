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
# copying to a build directory to append the config.js into app.js
# This is to remove the number of S3 GET request
rm -rf build 2>/dev/null
cp -r www build
cd build/js
sed -i '1,6d' app.js
cat config.js app.js > app.js.tmp && mv app.js.tmp app.js
rm config.js
cd ..
aws s3 sync . s3://$bucketName --acl public-read --delete
cd ..
echo "Sync www content with S3 bucket $bucketName end"

cd functions

echo
# Updating Lambda Functions
for f in $(ls -1); do
  echo "Deploying code for function $f begin..."
  cd $f
  # Zipping the source files
  rm -rf build 2>/dev/null
  mkdir build 2>/dev/null
  zip build/$f.zip index.js package.json
  #Updating the function code
  aws lambda update-function-code \
    --region $region \
    --function-name $f \
    --zip-file fileb://./build/$f.zip
  cd ..
  echo "Updating function $f end"
done

cd ..
