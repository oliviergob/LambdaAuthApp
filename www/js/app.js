var config = {
  "identityPoolId": "",
  "userPoolId": "",
  "userPoolClientId": "",
  "region": ""
}

var AWS;
var AWSCognito;

var username;

function loadCredentials(callback)
{
  AWS.config.region = config.region; // Region
  AWSCognito.config.region = config.region;

  // If user is authenticated
  if(localStorage.getItem("token"))
  {
    var logins = {};
    logins["cognito-idp."+config.region+".amazonaws.com/"+config.userPoolId] = JSON.parse(localStorage.getItem("token"));

    // Thanks to our ID Token Cognito Federated Identity is providing us
    // with some AWS credentials that we will use later on for API calls
    AWS.config.credentials = new AWS.CognitoIdentityCredentials({
        IdentityPoolId: config.identityPoolId,
        Logins: logins
    });

    // Parsing the identity token to extract the username
    var token = localStorage.getItem("token");
    var base64Url = token.split(".")[1];
    var base64 = base64Url.replace("-", "+").replace("_", "/");
    username = (JSON.parse(window.atob(base64)))["cognito:username"];

    //TODO - Verify the token is still valid and we actually managed to get credentials

  }
  // Making sure the callback is a function
   if (typeof callback === "function") {
       callback();
   }

}

loadCredentials();

// Activate the Nav Panel link the user just clicked on
$(".nav li").on("click", function() {
    $(".nav li").removeClass("active");
    $(this).addClass("active");
});

// This function update toggle the login / logout button depending
// on the user's authentication status
function updateAuthenticationStatus(){
  $("#user").empty();
  $("#login").empty();
  // retreiving the user's ID Token
  var user = localStorage.getItem("token");
  // If the user is authenticated
  if(user){
    $("#user").show().append("<a href=\"#\" onclick=\"logout()\">Log out ("+username+")</a>");
    $("#login").hide();
  } else {
    $("#login").show().append("<a href=\"#\"onclick=\"login()\">Log in</a>");
    $("#user").hide();
  }
}


// Function to log the user out
function logout(){
  // Clearing the tokens and other info stored in localstorage
  localStorage.clear();
  window.location = "/";
}



function loadBasicData(){
  $("#sensitiveDataContainer").hide();
  $("#loginContainer").hide();
  $("#registerUserContainer").hide();
  $("#resetPasswordContainer").hide();
  $("#forgotPasswordContainer").hide();
  $("#changePasswordContainer").hide();
  $("#basicDataContainer").show();


  // Clearing previous messages
  $("#basicData").empty();

  // If the user is authenticated (no need to call the API autherwise)
  if(localStorage.getItem("token")){

    // Initialising AWS Lambda client
    var lambda = new AWS.Lambda();


    var event={key:"randomKey"};
    // Invoking the lambda function using the AWS credentials already set
    // by the loadCredentials() function
    lambda.invoke({
        FunctionName: "basicDataAccess",
        Payload: JSON.stringify(event, null, 2) // pass params
      }, function(error, data) {
        if (error) {
          $("#basicData").append("<div class=\"alert alert-danger\">Error retreiving data</div>");
        }
        else {
          data=JSON.parse(data.Payload);
          if(data.httpStatus === 200){
            $("#basicData").append("<div class=\"alert alert-success\">"+ data.value +"</div>");
          } else {
            $("#basicData").append("<div class=\"alert alert-danger\">"+ data.message +"</div>");
          }
        }
      });
  }
}

$(document).ready(function(){
  // Always update authentication status when loading the home page
  updateAuthenticationStatus();
  loadBasicData();
});

function loadSensitiveData(){
  $("#basicDataContainer").hide();
  $("#loginContainer").hide();
  $("#registerUserContainer").hide();
  $("#resetPasswordContainer").hide();
  $("#forgotPasswordContainer").hide();
  $("#changePasswordContainer").hide();
  $("#sensitiveDataContainer").show();

  // Clearing previous messages
  $("#sensitiveData").empty();

  // If the user is authenticated (no need to call the API autherwise)
  if(localStorage.getItem("token")){

    // Initialising AWS Lambda client
    var lambda = new AWS.Lambda();

    var event={key:"randomKey"};
    // Invoking the lambda function using the AWS credentials already set
    // by the loadCredentials() function
    lambda.invoke({
        FunctionName: "adminDataAccess",
        Payload: JSON.stringify(event, null, 2) // pass params
      }, function(error, data) {
        if (error) {
          $("#sensitiveData").append("<div class=\"alert alert-danger\">Error retreiving data</div>");
        }
        else {
          data=JSON.parse(data.Payload);
          if(data.httpStatus == 200){
            $("#sensitiveData").append("<div class=\"alert alert-success\">"+ data.value +"</div>");
          } else {
            $("#sensitiveData").append("<div class=\"alert alert-danger\">"+ data.message +"</div>");
          }
        }
      });
  }
}

function login(){
  $("#basicDataContainer").hide();

  $("#sensitiveDataContainer").hide();
  $("#registerUserContainer").hide();
  $("#resetPasswordContainer").hide();
  $("#forgotPasswordContainer").hide();
  $("#changePasswordContainer").hide();

  $("#signinMessage").empty();
  $("#signin").trigger("reset");
  $("#signin :input").prop("disabled", false);
  $("#signinNewPasswordGroup").hide();
  $("#updatePasswordButton").hide();
  $("#loginButton").show();

  $("#loginContainer").show();
}

function regsiterUser(){
  $("#basicDataContainer").hide();
  $("#loginContainer").hide();
  $("#sensitiveDataContainer").hide();
  $("#resetPasswordContainer").hide();
  $("#forgotPasswordContainer").hide();
  $("#changePasswordContainer").hide();

  $("#registerMessage").empty();
  $("#register").trigger("reset");
  $("#register :input").prop("disabled", false);

  $("#registerUserContainer").show();


}

function forgotPassword(){
  $("#basicDataContainer").hide();
  $("#loginContainer").hide();
  $("#sensitiveDataContainer").hide();
  $("#registerUserContainer").hide();
  $("#resetPasswordContainer").hide();
  $("#changePasswordContainer").hide();

  $("#forgotPasswordMessage").empty();
  $("#forgotPassword").trigger("reset");
  $("#forgotPassword :input").prop("disabled", false);

  $("#forgotPasswordContainer").show();
}



function resetPassword(){

  $("#basicDataContainer").hide();
  $("#loginContainer").hide();
  $("#sensitiveDataContainer").hide();
  $("#registerUserContainer").hide();
  $("#changePasswordContainer").hide();
  $("#forgotPasswordContainer").hide();

  $("#resetPasswordMessage").empty();
  $("#resetPassword").trigger("reset");
  $("#resetPassword :input").prop("disabled", false);

  $("#resetPasswordContainer").show();


}


function changePassword(){

  $("#basicDataContainer").hide();
  $("#loginContainer").hide();
  $("#sensitiveDataContainer").hide();
  $("#registerUserContainer").hide();
  $("#resetPasswordContainer").hide();
  $("#forgotPasswordContainer").hide();

  $("#changePasswordMessage").empty();
  $("#changePassword").trigger("reset");
  $("#changePassword :input").prop("disabled", false);

  $("#changePasswordContainer").show();
}

$("#changePassword").submit(function(e){

  // Emptying previous error messages
  $("#changePasswordMessage").empty();

  // Getting accessToken from local storage
  var accessToken = JSON.parse(localStorage.getItem("accessToken"));

  var params = {
    PreviousPassword: $("#oldPassword").val(),
    ProposedPassword: $("#newPassword").val(),
    AccessToken: accessToken
  };
  var cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider();
  cognitoidentityserviceprovider.changePassword(params, function(err, data) {
    if (err)
    {
      $("#changePasswordMessage").append("<div class=\"alert alert-danger\">"+err.message+"</div>");
    }
    else
    {
      $("#changePasswordMessage").append("<div class=\"alert alert-success\">Password succesfully updated \n"+
                                         "<br> \n"+
                                         "you will be redirected to the login page shortly</div>");
      // Redirecting the user to login page after 3 seconds
      window.setTimeout(function () {
          // Clearing the tokens and other info stored in localstorage
          localStorage.clear();
          login();
         },
       3000);
    }
  });

});

$("#resetPassword").submit(function(e){

  // Emptying previous error messages
  $("#resetPasswordMessage").empty();


  // Building the userPool object
  var userPool = new AWSCognito.CognitoIdentityServiceProvider.CognitoUserPool({
    UserPoolId : config.userPoolId,
    ClientId : config.userPoolClientId
  });

  // Building the cognitoUser object
  var userData = {
      Username : localStorage.getItem("userName"),
      Pool : userPool
  };

  var cognitoUser = new AWSCognito.CognitoIdentityServiceProvider.CognitoUser(userData);

  // Confirming the user's new password using the security code the user received by mail
  cognitoUser.confirmPassword($("#resetSecurityCode").val(), $("#resetNewPassword").val(), {
        onSuccess: function (result) {
            $("#resetPasswordMessage").append("<div class=\"alert alert-success\">Password succesfully updated \n"+
                                               "<br> \n"+
                                               "you will be redirected to the login page shortly</div>");
            // Redirecting the user to login page after 3 seconds
            window.setTimeout(function () {
                 login();
            }, 3000);
        },
        // If an error occured let's display the error message
        onFailure: function(err) {
            $("#resetPasswordMessage").append("<div class=\"alert alert-danger\">"+err.message+"</div>");
        },
    });

});

$("#forgotPassword").submit(function(e){

  // Emptying previous error messages
  $("#forgotPasswordMessage").empty();

  // Need to provide placeholder keys unless unauthorised user access is enabled for user pool
  AWSCognito.config.update({accessKeyId: 'anything', secretAccessKey: 'anything'});

  var userPool = new AWSCognito.CognitoIdentityServiceProvider.CognitoUserPool({
    UserPoolId : config.userPoolId,
    ClientId : config.userPoolClientId
  });

  var userData = {
      Username : $("#fpUserName").val(),
      Pool : userPool
  };

  var cognitoUser = new AWSCognito.CognitoIdentityServiceProvider.CognitoUser(userData);
  // Let's store the username for later use
  localStorage.setItem("userName", $("#fpUserName").val());

  // Requesting Cognito User Pool to initiate the reset password for this user
  cognitoUser.forgotPassword({
        onSuccess: function (result) {
            resetPassword();
        },
        // If an error occured let's display the error message
        onFailure: function(err) {
            $("#forgotPasswordMessage").append("<div class=\"alert alert-danger\">"+err.message+"</div>");
        },
    });
});



$("#signin").submit(function(e){
  e.preventDefault();
  // Emptying previous error messages
  $("#signinMessage").empty();
  // Need to provide placeholder keys unless unauthorised user access is enabled for user pool
  AWSCognito.config.update({accessKeyId: 'anything', secretAccessKey: 'anything'});

  var userPool = new AWSCognito.CognitoIdentityServiceProvider.CognitoUserPool({
    UserPoolId : config.userPoolId,
    ClientId : config.userPoolClientId
  });

  var authenticationData = {
    Username : $("#signinUsername").val(),
    Password : $("#signinPassword").val(),
  };
  var userData = {
    Username : $("#signinUsername").val(),
    Pool : userPool
  };
  var authenticationDetails = new AWSCognito.CognitoIdentityServiceProvider.AuthenticationDetails(authenticationData);
  var cognitoUser = new AWSCognito.CognitoIdentityServiceProvider.CognitoUser(userData);

  cognitoUser.authenticateUser(authenticationDetails, {
    onSuccess: function (result) {
      // Let's store the Id and Access tokens for later use
      localStorage.setItem("token", JSON.stringify(result.getIdToken().getJwtToken()));
      localStorage.setItem("accessToken", JSON.stringify(result.getAccessToken().getJwtToken()));
      window.location = "/";
    },
    // If an error occured let's display the error message
    onFailure: function(err) {
      console.log("error authenticating user"+err);
      $("#signinMessage").append("<div class=\"alert alert-danger\">"+err.message+"</div>");
    },
    newPasswordRequired: function(userAttributes, requiredAttributes) {
      // User was signed up by an admin and must provide new
      // password and required attributes, if any, to complete
      // authentication.

      // First time arround, let's display new fields so the user can update his/her password
      if ($("#signinNewPasswordGroup").is(":hidden"))
      {

        // Displaying new fields
        $("#signinUsername").prop("disabled", true);
        $("#signinPassword").prop("disabled", true);
        $("#signinNewPasswordGroup").show();
        $("#updatePasswordButton").show();
        $("#loginButton").hide();
        $("#signinMessage").append("<div class=\"alert alert-danger\">Your password is epxired, please provide a new one</div>");
        $("#signinMessage").show();

      }
      // The user entered a new password
      // Let's update it in Cognito User Pool
      else {
        userAttributes["name"]=$("#signinUsername").val();

        // the api doesn't accept this field back
        delete userAttributes.email_verified;

        // Update user password and log the user in
        cognitoUser.completeNewPasswordChallenge($("#signinNewPassword").val(), userAttributes, {
          onSuccess: function(result) {
            //
            localStorage.setItem("token", JSON.stringify(result.idToken.jwtToken));
            localStorage.setItem("accessToken", JSON.stringify(result.getAccessToken().getJwtToken()));

            $("#signinMessage").append("<div class=\"alert alert-success\">Password succesfully updated \n"+
                                               "<br> \n"+
                                               "you will be redirected to the home page shortly</div>");

            // Redirecting the user to the home page after 3 seconds
             window.setTimeout(function () {
                  window.location = '/';
             }, 3000);

          },
          // If an error occured let's display the error message
          onFailure: function(error) {
            $("#signinMessage").append("<div class=\"alert alert-danger\">"+error.message+"</div>");
          }
        });
      }
    }
  });
});

// Function to generate a 10 to 13 character long password
// with at least one of the following:
//   - Lowercase character
//   - Uppercase character
//   - Special character
//   - Number
function generatePassword () {
  var specials = "!@#$%^&*()_+{}:\"<>?\|[];\',./`~";
  var lowercase = "abcdefghijklmnopqrstuvwxyz";
  var uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  var numbers = "0123456789";

  var all = specials + lowercase + uppercase + numbers;

  String.prototype.pick = function(min, max) {
      var n, chars = "";

      if (typeof max === "undefined") {
          n = min;
      } else {
          n = min + Math.floor(Math.random() * (max - min));
      }

      for (var i = 0; i < n; i++) {
          chars += this.charAt(Math.floor(Math.random() * this.length));
      }

      return chars;
  };


  // Credit to @Christoph: http://stackoverflow.com/a/962890/464744
  String.prototype.shuffle = function() {
      var array = this.split("");
      var tmp, current, top = array.length;

      if (top)
      {
        while (--top) {
          current = Math.floor(Math.random() * (top + 1));
          tmp = array[current];
          array[current] = array[top];
          array[top] = tmp;
        }
      }

      return array.join("");
    };

    var password = (specials.pick(1) + lowercase.pick(1) + uppercase.pick(1) + all.pick(10, 13)).shuffle();

    return(password);
}


$("#register").submit(function(e){
  $("#registerMessage").empty();
  e.preventDefault();
  var cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider();

  var userPool = new AWSCognito.CognitoIdentityServiceProvider.CognitoUserPool({
    UserPoolId : config.userPoolId,
    ClientId : config.userPoolClientId
  });


  var params = {
    UserPoolId: config.userPoolId,
    Username: $("#username").val(),
    DesiredDeliveryMediums: ["EMAIL" ],
    ForceAliasCreation: false,
    TemporaryPassword: generatePassword(),
    UserAttributes: [
      {
        Name: "email",
        Value: $("#email").val(),
      },
      // Users are created by admin so no need to verify email
      {
        Name: "email_verified",
        Value: "True"
      }
    ]
  };
  cognitoidentityserviceprovider.adminCreateUser(params, function(err, data) {
    if (err)
    {
      $("#registerMessage").append("<div class=\"alert alert-danger\">Error while creating the user</div>");
    }
    else
    {
        $("#registerMessage").append("<div class=\"alert alert-success\">User successfuly created</div>");
        $("#register :input").prop("disabled", true);
    }
  });



})
