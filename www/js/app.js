

loadCredentials();

function loadCredentials(callback)
{
  AWS.config.region = config.region; // Region
  AWSCognito.config.region = config.region;
  var username;
  if(localStorage.getItem('token'))
  {
    var logins = {}
    logins['cognito-idp.'+config.region+'.amazonaws.com/'+config.userPoolId] = JSON.parse(localStorage.getItem('token'))

    AWS.config.credentials = new AWS.CognitoIdentityCredentials({
        IdentityPoolId: config.identityPoolId,
        Logins: logins
    });

    // Parsing the identity token to get the username
    var token = localStorage.getItem('token');
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace('-', '+').replace('_', '/');
    username = (JSON.parse(window.atob(base64)))["cognito:username"];

    //TODO - Verify the token is still valid and we actually managed to get credentials

  }
  // Make sure the callback is a function​
   if (typeof callback === "function") {
       callback();
   }

}


var lambda = new AWS.Lambda();


$(".nav li").on("click", function() {
    $(".nav li").removeClass("active");
    $(this).addClass("active");
});

$(document).ready(function(){
  updateAuthenticationStatus();
  loadBasicData();

});
function logout(){
  localStorage.clear();
  window.location = '/';
};

function updateAuthenticationStatus(){
  $('#user').empty();
  $('#login').empty();
  var user = localStorage.getItem('token');
  if(user){
    $('#user').show().append('<a href="#" onclick="logout()">Log out ('+username+')</a>');
    $('#login').hide();
  } else {
    $('#login').show().append('<a href="#"onclick="login()">Log in</a>');
    $('#user').hide();
  }
}


function loadBasicData(){
  $('#sensitiveDataContainer').hide();
  $('#loginContainer').hide();
  $('#registerUserContainer').hide();
  $('#resetPasswordContainer').hide();
  $('#forgotPasswordContainer').hide();
  $('#changePasswordContainer').hide();
  $('#basicDataContainer').show();


  // Clearing previous messages
  $('#basicData').empty();

  if(localStorage.getItem('token')){

    var event={key:"randomKey"};
    lambda.invoke({
        FunctionName: 'basicDataAccess-development',
        Payload: JSON.stringify(event, null, 2) // pass params
      }, function(error, data) {
        if (error) {
          $('#basicData').append('<div class="alert alert-danger">Error retreiving data</div>')
        }
        else {
          data=JSON.parse(data.Payload);
          if(data.httpStatus == 200){
            $('#basicData').append('<div class="alert alert-success">'+ data.value +'</div>')
          } else {
            $('#basicData').append('<div class="alert alert-danger">'+ data.message +'</div>')
          }
        }
      });
  }
}


function loadSensitiveData(){
  $('#basicDataContainer').hide();
  $('#loginContainer').hide();
  $('#registerUserContainer').hide();
  $('#resetPasswordContainer').hide();
  $('#forgotPasswordContainer').hide();
  $('#changePasswordContainer').hide();
  $('#sensitiveDataContainer').show();


  // Clearing previous messages
  $('#sensitiveData').empty();

  if(localStorage.getItem('token')){

    var event={key:"randomKey"};
    lambda.invoke({
        FunctionName: 'adminDataAccess-development',
        Payload: JSON.stringify(event, null, 2) // pass params
      }, function(error, data) {
        if (error) {
          $('#sensitiveData').append('<div class="alert alert-danger">Error retreiving data</div>')
        }
        else {
          data=JSON.parse(data.Payload);
          if(data.httpStatus == 200){
            $('#sensitiveData').append('<div class="alert alert-success">'+ data.value +'</div>')
          } else {
            $('#sensitiveData').append('<div class="alert alert-danger">'+ data.message +'</div>')
          }
        }
      });
  }
}

function login(){
  $('#basicDataContainer').hide();

  $('#sensitiveDataContainer').hide();
  $('#registerUserContainer').hide();
  $('#resetPasswordContainer').hide();
  $('#forgotPasswordContainer').hide();
  $('#changePasswordContainer').hide();

  $('#signinMessage').empty();
  $('#signin').trigger("reset");
  $("#signin :input").prop("disabled", false);
  $("#signInNewPasswordGroup").hide();
  $("#updatePasswordButton").hide();
  $("#loginButton").show();

  $('#loginContainer').show();
}

function regsiterUser(){
  $('#basicDataContainer').hide();
  $('#loginContainer').hide();
  $('#sensitiveDataContainer').hide();
  $('#resetPasswordContainer').hide();
  $('#forgotPasswordContainer').hide();
  $('#changePasswordContainer').hide();

  $('#registerMessage').empty();
  $('#register').trigger("reset");
  $("#register :input").prop("disabled", false);

  $('#registerUserContainer').show();


}

function forgotPassword(){
  $('#basicDataContainer').hide();
  $('#loginContainer').hide();
  $('#sensitiveDataContainer').hide();
  $('#registerUserContainer').hide();
  $('#resetPasswordContainer').hide();
  $('#changePasswordContainer').hide();

  $('#forgotPasswordMessage').empty();
  $('#forgotPassword').trigger("reset");
  $("#forgotPassword :input").prop("disabled", false);

  $('#forgotPasswordContainer').show();
}



function resetPassword(){

  $('#basicDataContainer').hide();
  $('#loginContainer').hide();
  $('#sensitiveDataContainer').hide();
  $('#registerUserContainer').hide();
  $('#changePasswordContainer').hide();
  $('#forgotPasswordContainer').hide();

  $('#resetPasswordMessage').empty();
  $('#resetPassword').trigger("reset");
  $("#resetPassword :input").prop("disabled", false);

  $('#resetPasswordContainer').show();
}


function changePassword(){

  $('#basicDataContainer').hide();
  $('#loginContainer').hide();
  $('#sensitiveDataContainer').hide();
  $('#registerUserContainer').hide();
  $('#resetPasswordContainer').hide();
  $('#forgotPasswordContainer').hide();

  $('#changePasswordMessage').empty();
  $('#changePassword').trigger("reset");
  $("#changePassword :input").prop("disabled", false);

  $('#changePasswordContainer').show();
}

$('#changePassword').submit(function(e){

  // Getting accessToken from local storage
  var accessToken = JSON.parse(localStorage.getItem('accessToken'));

  var params = {
    PreviousPassword: $('#oldPassword').val(),
    ProposedPassword: $('#newPassword').val(),
    AccessToken: accessToken
  };
  var cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider();
  cognitoidentityserviceprovider.changePassword(params, function(err, data) {
    if (err) console.log(err, err.stack); // an error occurred
    else     console.log(data);           // successful response
  });

});

$('#forgotPassword').submit(function(e){
  // Need to provide placeholder keys unless unauthorised user access is enabled for user pool
  AWSCognito.config.update({accessKeyId: 'anything', secretAccessKey: 'anything'});

  var userPool = new AWSCognito.CognitoIdentityServiceProvider.CognitoUserPool({
    UserPoolId : config.userPoolId,
    ClientId : config.userPoolClientId
  });

  var userData = {
      Username : $('#username').val(),
      Pool : userPool
  };

  var cognitoUser = new AWSCognito.CognitoIdentityServiceProvider.CognitoUser(userData);
  cognitoUser.forgotPassword({
        onSuccess: function (result) {
            console.log('call result: ' + result);
            console.dir(result);
            resetPassword();
        },
        onFailure: function(err) {
            alert(err);
        },
    });
});



$('#signin').submit(function(e){
  e.preventDefault();
  // Need to provide placeholder keys unless unauthorised user access is enabled for user pool
  AWSCognito.config.update({accessKeyId: 'anything', secretAccessKey: 'anything'});

  var userPool = new AWSCognito.CognitoIdentityServiceProvider.CognitoUserPool({
    UserPoolId : config.userPoolId,
    ClientId : config.userPoolClientId
  });

  var authenticationData = {
    Username : $('#username').val(),
    Password : $('#password').val(),
  };
  var userData = {
    Username : $('#username').val(),
    Pool : userPool
  };
  var authenticationDetails = new AWSCognito.CognitoIdentityServiceProvider.AuthenticationDetails(authenticationData);
  var cognitoUser = new AWSCognito.CognitoIdentityServiceProvider.CognitoUser(userData);

  cognitoUser.authenticateUser(authenticationDetails, {
    onSuccess: function (result) {
      localStorage.setItem('token', JSON.stringify(result.idToken.jwtToken));
      localStorage.setItem('accessToken', JSON.stringify(result.getAccessToken().getJwtToken()));
      window.location = '/';
    },
    onFailure: function(err) {
      console.log("error authenticating user"+err);
    },
    newPasswordRequired: function(userAttributes, requiredAttributes) {
            // User was signed up by an admin and must provide new
            // password and required attributes, if any, to complete
            // authentication.

            // the api doesn't accept this field back
            delete userAttributes.email_verified;

            console.dir(userAttributes);

            $("#Username").prop("disabled", true);
            $("#Password").prop("disabled", true);
            $("#signInNewPasswordGroup").show();
            $("#updatePasswordButton").show();
            $("#loginButton").hide();

            // Get these details and call
            //cognitoUser.completeNewPasswordChallenge(newPassword, userAttributes, this);
    }
  });
})


$('#register').submit(function(e){
  $('#registerMessage').empty();
  e.preventDefault();
  var cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider();

  var userPool = new AWSCognito.CognitoIdentityServiceProvider.CognitoUserPool({
    UserPoolId : config.userPoolId,
    ClientId : config.userPoolClientId
  });

  var username = document.forms['register'].elements["username"].value;
  var password = document.forms['register'].elements["password"].value;
  var email = document.forms['register'].elements["email"].value;

  var attributeList = [];

  var dataEmail = {
      Name : 'email',
      Value : email
  };
  var params = {
    UserPoolId: config.userPoolId,
    Username: username,
    DesiredDeliveryMediums: ['EMAIL' ],
    ForceAliasCreation: false,
    TemporaryPassword: password,
    UserAttributes: [
      {
        Name: 'email',
        Value: email
      }
    ]
  };
  cognitoidentityserviceprovider.adminCreateUser(params, function(err, data) {
    if (err)
    {
      $('#registerMessage').append('<div class="alert alert-danger">Error while creating the user</div>')
    }
    else
    {
        $('#registerMessage').append('<div class="alert alert-success">User successfuly created</div>')
        $("#register :input").prop("disabled", true);
    }
  });



})
