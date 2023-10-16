
function getRequiredParamsNames(){
  return ["EndpointForAuthentication"];
}

function getOptionalParamsNames(){
  return [];
}

function getCredentialsParamsNames(){
  return ["username", "password"];
}
var HttpRequestHeader = Java.type('org.parosproxy.paros.network.HttpRequestHeader');
var HttpHeader = Java.type('org.parosproxy.paros.network.HttpHeader');
var URI = Java.type('org.apache.commons.httpclient.URI');
var ScriptVars = Java.type('org.zaproxy.zap.extension.script.ScriptVars');

function authenticate(helper, paramsValues, credentials) {
  print("\nAuthenticating via JavaScript script...");

  // Load the API endpoint against which we need to POST our request to authenticate
  var endpoint = paramsValues.get("EndpointForAuthentication");
  print("\nAuth endpoint is " + endpoint);

  // Create a few Java objects that we will need later
  // First, a URI for the endpoint
  var requestUri = new URI(endpoint, false);
  // Set the request method to POST...
  var requestMethod = HttpRequestHeader.POST;
  // ...and assemble the necessary requestHeader for the request
  var requestHeader = new HttpRequestHeader(requestMethod, requestUri, HttpHeader.HTTP11);
  
  // Prepare a message that we can later send using ZAP...
  var msg = helper.prepareMessage();
  // ...and set the request headers on it
  msg.setRequestHeader(requestHeader);

  // Load the client_id and client_secret from the script parameters
  var Username = credentials.getParam("username");
  var Password = credentials.getParam("password")
  print("Authenticate with username: " +  Username);
    print("Authenticate with password: " +  Password);

  // Assemble an OAuth 2.0 Client Credentials POST body, which basically consists of three parts:
  // - the grant_type set to client_credentials
  // - the client_id parameter and value
  // - the client_secret parameter and value
  msg.setRequestBody("username=" + Username + "&password=" + Password);
  // Set the correct content length in the message header
  msg.getRequestHeader().setContentLength(msg.getRequestBody().length());

  // Send the message and receive the response
  helper.sendAndReceive(msg);

  // Extract the response body as a string
  //
  // We're going to be pulling out the JWT and saving it into a global variable here.
  // This will allow you to simply activate the "addBearerTokenHeader.js" HTTP sender
  // script to authenticate all requests you are sending.
  //
  // If your setup requires more complex handling, you can remove most of the rest of
  // this function and instead write a session script - it will get access to the 
  // message you return from this function, and you can extract the data and do 
  // things with it from there.
  var response = msg.getResponseBody().toString();
  // Debug loggin the response
  // TURN THIS OFF IF THE TOKEN IS SENSITIVE AND OTHERS MAY READ YOUR LOGS
  print("\nResponse is: " + response);
  // Parse the embedded JSON that is returned by the server
  var json = JSON.parse(response);

  // The access token is contained in the returned object under the access_token key
  var token = json.id;
  // Debug statement
  // TURN THIS OFF IF THE TOKEN IS SENSITIVE AND OTHERS MAY READ YOUR LOGS
  print("\n Endpoint returned token: " + token);

  // Save the data to the access_token global variable (which is the one that is read
  // by the AddBearerTokenHeader.js script)
  ScriptVars.setGlobalVar("access_token", token);

  // Return the message, as that is what the API expects us to do.
  return msg;
}