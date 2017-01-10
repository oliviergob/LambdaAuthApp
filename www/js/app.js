

AWS.config.region = config.region; // Region
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
  $('#loginContainer').show();
  $('#sensitiveDataContainer').hide();
  $('#registerUserContainer').hide();
}

function regsiterUser(){
  $('#basicDataContainer').hide();
  $('#loginContainer').hide();
  $('#sensitiveDataContainer').hide();

  $('#registerMessage').empty();
  $('#register').trigger("reset");
  $("#register :input").prop("disabled", false);

  $('#registerUserContainer').show();


}




$('#signin').submit(function(e){
  e.preventDefault();
  AWSCognito.config.region = 'us-east-1';
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
      window.location = '/';
    },
    onFailure: function(err) {
      console.log("error authenticating user"+err);
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
