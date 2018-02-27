console.log("Loading function");

exports.handler = (event, context, callback) => {
	var key = event.key;


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
			};
			callback(null,myErrorObj);
			return;
		}
	}

	validateMandatoryParam(key, "key", callback);

	var data = {
			httpStatus : 200,
      type: "Basic User Data",
      value: "Some not very important data"
    };


	callback(null, data);

};
