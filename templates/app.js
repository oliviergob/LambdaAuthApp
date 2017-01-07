var config = {
  "identityPoolId": "IDPOOL",
  "userPoolId": "USERPOOLID",
  "userPoolClientId": "USERPOOLCLIENT",
  "region": "AWSREGION"
}

var logins = {}
logins['cognito-idp.'+config.region+'.amazonaws.com/'+config.userPoolId] = JSON.parse(localStorage.getItem('token'))

AWS.config.region = config.region; // Region
AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: config.identityPoolId,
    Logins: logins
});


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
    $('#user').show().append('<a href="#" onclick="logout()">Log out</a>');
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



  var myNode = document.getElementById("basicData");
  while (myNode.firstChild) {
      myNode.removeChild(myNode.firstChild);
  }

  if(localStorage.getItem('token')){

    var event={key:"randomKey"};
    lambda.invoke({
        FunctionName: 'basicDataAccess-development',
        Payload: JSON.stringify(event, null, 2) // pass params
      }, function(error, data) {
        if (error) {
          console.dir(error);
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
}

function manageUsers(){
  $('#basicDataContainer').hide();
  $('#loginContainer').hide();
  $('#sensitiveDataContainer').hide();
  $('#registerUserContainer').hide();
  $('#manageUsersContainer').show();
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
  e.preventDefault();
  var cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider();

  var userPool = new AWSCognito.CognitoIdentityServiceProvider.CognitoUserPool({
    UserPoolId : config.userPoolId,
    ClientId : config.userPoolClientId
  });

  var username = document.forms['register'].elements["username"].value;
  var password = document.forms['register'].elements["password"].value;
  var email = document.forms['register'].elements["email"].value;
  var role = document.forms['register'].elements["role"].value;

  var attributeList = [];

  var dataEmail = {
      Name : 'email',
      Value : email
  };
  var dataRole = {
      Name : 'role',
      Value : role
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
    if (err) console.log(err, err.stack); // an error occurred
    else     console.log(data);           // successful response
  });

})
