AWS.config.region = 'us-east-1'; // Region
AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: 'us-east-1:ec5d9472-1c1d-4fc0-a034-bb28669a654f',
    Logins: {
      'cognito-idp.us-east-1.amazonaws.com/us-east-1_7UTEPaGZZ': JSON.parse(localStorage.getItem('token'))
    }
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
    $('#user').show().append('<a onclick="logout()">Log out</a>');
    $('#login').hide();
  } else {
    $('#login').show().append('<a href="/login.html">Log in</a>');
    $('#user').hide();
  }
}


function loadBasicData(){
  if(localStorage.getItem('token')){
    AWS.config.credentials.get(function (err) {
      var client = apigClientFactory.newClient({
        accessKey: AWS.config.credentials.accessKeyId,
        secretKey: AWS.config.credentials.secretAccessKey,
        sessionToken: AWS.config.credentials.sessionToken,
        region: 'us-east-1'
      });
      client.basicdataaccessPost({}, {key:"Tralala"}, {})
      .then(function(data){
        if(data.data.httpStatus == 200){
          $('#basicData').append('<div class="alert alert-success">'+ data.data.value +'</div>')
        } else {
          $('#basicData').append('<div class="alert alert-danger">'+ data.data.message +'</div>')
        }
      }).catch( function(result){
        $('#basicData').append('<div class="alert alert-danger">Error retreiving data</div>')
      })
    });
  }
}

$('#signin').submit(function(e){
  e.preventDefault();
  AWSCognito.config.region = 'us-east-1';
  AWSCognito.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: 'us-east-1_7UTEPaGZZ'
  });
  // Need to provide placeholder keys unless unauthorised user access is enabled for user pool
  AWSCognito.config.update({accessKeyId: 'anything', secretAccessKey: 'anything'});

  var userPool = new AWSCognito.CognitoIdentityServiceProvider.CognitoUserPool({
    UserPoolId : 'us-east-1_7UTEPaGZZ',
    ClientId : '15lpt5oc409qopbtd2k1bjgfna'
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
      console.log(err);
    }
  });
})
