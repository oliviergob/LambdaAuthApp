Serverless Simple Auth App
===================

Serverless Simple Auth App is a simple single page app using a Serverless architecture.
It is a practice / prototype project.

It is using the following AWS technologies:
* S3 - to serve the Website static content
* Cognito User Pool - to authenticate the users)
* Cognito Federated Identity - provide temporary AWS credentials
* IAM - Manage different level of privileges
* Lambda - Serverless APIs


![Architecture Diagramm](https://s3.amazonaws.com/simpleauthapp.og-simple-app-bucket/img/serverless-simple-auth-app.png)

There are two types of users:

* Basic users can:
  * Authenticate
  * View Basic Data (by calling basicDataAccess Lambda function)
  * Reset their password
* Admin users can also:
  * View Sensitive Data (by calling adminDataAccess Lambda function)
  * Create other users
  

Demo
-------------
A live demo of it is running [here](http://simpleauthapp.og-simple-app-bucket.s3-website-us-east-1.amazonaws.com/)
Credentials:
* admin
* eiNH22bc.adm

Feel free to create yourself a user!

*Note: The top menus are always on, regardless of which type of user is logged in. This is by design, the goal of this app is to prove the authentication / groups mechanism provided by Cognito and Iam Roles.
A basic user can attempt to call the adminDataAccess but will not succeed* 

