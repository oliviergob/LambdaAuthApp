AWS.config.region = 'us-east-1'; // Region
AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: 'us-east-1:80561d71-faa2-46b1-9cec-dc03226b7f12',
    Logins: {
      'cognito-idp.us-east-1.amazonaws.com/us-east-1_j18XflhDT': JSON.parse(localStorage.getItem('token'))
    }
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
  $('#sensitiveDataContainer').show();
}


function login(){
  $('#basicDataContainer').hide();
  $('#loginContainer').show();
  $('#sensitiveDataContainer').hide();
}

$('#signin').submit(function(e){
  e.preventDefault();
  AWSCognito.config.region = 'us-east-1';
  // Need to provide placeholder keys unless unauthorised user access is enabled for user pool
  AWSCognito.config.update({accessKeyId: 'anything', secretAccessKey: 'anything'});

  var userPool = new AWSCognito.CognitoIdentityServiceProvider.CognitoUserPool({
    UserPoolId : 'us-east-1_j18XflhDT',
    ClientId : '7lhd9srvjsdfmnc23oribgjcir'
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
