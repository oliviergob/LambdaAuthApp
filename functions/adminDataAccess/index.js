console.log('Loading function');

exports.handler = (event, context, callback) => {
	var key = event.key;

	validateMandatoryParam(key, 'key', callback);

	var data = {
      type: "Admin User Data",
      Value: "Some super important data"
    };

	callback(null, data);

	function validateMandatoryParam(varToValidate, varName, callback)
	{
		if ( varToValidate == null )
		{
			var errorMessage = "Missing mandatory parameter "+varName;
			console.error(errorMessage);
			var myErrorObj = {
					errorType : "InternalServerError",
					httpStatus : 500,
					requestId : context.awsRequestId,
					message : errorMessage
			}
			callback(JSON.stringify(myErrorObj));
			return;
		}
	}

}
