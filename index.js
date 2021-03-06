// load the mysql library
var mysql = require('mysql');

// create a connection to our Cloud9 server
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root', // my Cloud9 user_name doesn't work :(
  password : '',
  database: 'reddit'
});

// load our API and pass it the connection
var reddit = require('./reddit');
var redditAPI = reddit(connection);

//load the express library to create our web server
var express = require('express');
var app = express();

//Here we load the body-parser library and configure express to use body-parser as middleware.
var bodyParser = require('body-parser');
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

//import all the render - html functions
var toHtml = require("./html");

//load the cookie-parser library and configure express to use it as middleware. 
/*this middleware will allow to add a `cookies` property to the request, 
an object of key:value pairs for all the cookies we set
*/
var cookieParser = require('cookie-parser');
app.use(cookieParser());


//load the middleware to serving static files in Express - and in this case the public folder
app.use(express.static('public'));



/*This function checks the request cookies for a cookie called SESSION
If it doesn't exist, call next() to exit the middleware
If exists, call the getUserFromSession to find the userId associated
and set it to a loggedInUser property on the request object.
This way each request handler can pick it up and do what it wants with it.
*/
function checkLoginToken(request, response, next) {
  //check if there's a SESSION cookie...
  if(request.cookies.SESSION) {
    redditAPI.getUserFromSession(request.cookies.SESSION, function(err, user) {
      if (user) {
        request.loggedInUser = user[0];
      }
      next();
    });
  }
  else {
    // if no SESSION cookie, move forward
    next();
  }
}  

// Adding the middleware to our express stack
app.use(checkLoginToken);




/*-------------This is the homepage. 
It lists up to 25 posts, by default sorted by the newest.
The homepage resource can take a query string parameter called sort that can have the following values: new, top, hot, controversial
*/
app.get('/', function(request, response){
  var cookie = request.cookies;
  var query = request.query.message
  redditAPI.getAllPosts(request.query.sort, function(err, posts){
    if (err) {
        response.status(500).send('Ooops... something went wrong. Try again later');
    }
    else {
      if(!query){
        response.send(toHtml.renderLayout('homepage', request.loggedInUser, toHtml.renderHomepage(posts), cookie.username, false, false, false, true));
      }
      else{
//'homepage' = pageTitle, request.loggedInUser = isLoggedIn, toHtml.homepage(posts) = content, isCreatePage, isSignup, isLogin
      response.send(toHtml.renderLayout('homepage', request.loggedInUser, toHtml.renderHomepage(posts, query), cookie.username, false, false, false, true)); 
      }
    }
  });
});
  

//------This receive the vote and calling the redditAPI.createOrUpdatedVote function passes the data for the database
app.post('/vote', function(request, response){
  if(!request.loggedInUser){
      response.send('You must be logged in to vote!');
  }
  else {
    redditAPI.createOrUpdateVote(request.body, request.loggedInUser.userId, function(err, result){
      if(err) {
        response.status(500).send('Ooops... something went wrong. Try again later');
      }
//This will send the result(voteScore) 
      else{
        response.send({result: result});
      }
    });  
  }
});


//---------------This is the create post page
app.get('/createPost', function(request, response) {
  var cookie = request.cookies;
  //'homepage' = pageTitle, request.loggedInUser = isLoggedIn, toHtml.homepage(posts) = content, isCreatePage, isSignup, isLogin, isHomepage
  response.send(toHtml.renderLayout('createPost', request.loggedInUser, toHtml.createPost(), cookie.username, true, false, false, false)); 
});
    
//Receiving data from our postPageform
//We grab POST parameters using req.body.variable_name to insert the data of this new post in the database 

app.post('/createPost', function(request, response){
// before creating content, check if the user is logged in
  if (!request.loggedInUser) {
    // HTTP status code 401 means Unauthorized
    response.status(401).send('You must be logged in to create content! <a href="https://reddit-nodejs-api-marie-evegauthier.c9users.io/login">log in</a>');
  }
  else {
    // here we have a logged user, let's create the post!
    //--the request.body is an objet like this {url: xxxx, title: xxxxx}
    //the request.loggedInUser is the userId

    redditAPI.createPost(request.body, request.loggedInUser.userId, function(err, post){
      if (err) {
        response.status(500).send(err.message);
      }
      else {
        //This will redirect the user to the newly created posts according to its id
        response.redirect(`/posts/${post.id}`);  
      }  
    });
  }
});

//------------------------This shows the post according to the id given as parameter in the url
app.get('/posts/:ID', function(request, response){
  var cookie = request.cookies;
  redditAPI.getSinglePost(request.params.ID, function(err, post){
    if (err) {
      response.status(500).send('Ooops... something went wrong. Try again later--posts/:ID');
    }
    else {
      if(post.url.substring(0,4) !== 'http'){
        post.url = 'http://' + post.url;
      }
//'homepage' = pageTitle, request.loggedInUser = isLoggedIn, toHtml.homepage(posts) = content, isCreatePage, isSignup, isLogin, isHomepage
  response.send(toHtml.renderLayout('post/request.params.ID', request.loggedInUser, toHtml.renderPost(post), cookie.username, false, false, false, false)); 
    }
  });
});


//---------------This is the signup page
app.get('/signup', function(request, response){
  var cookie = request.cookies;
  //'homepage' = pageTitle, request.loggedInUser = isLoggedIn, toHtml.homepage(posts) = content, isCreatePage, isSignup, isLogin, isHomepage
  response.send(toHtml.renderLayout('signup', request.loggedInUser, toHtml.renderSignupForm(), cookie.username, false, true, false, false)); 
});

//Receiving data from our signup page
//We grab POST parameters using req.body.variable_name to insert the data of this new user in the database 
app.post('/signup', function(request, response){
  var username = request.body.username;
  var password = request.body.password;
  if (password === '') {
    response.send('You must have a password');
  }
  else {
    redditAPI.createUser(request.body, function(err, user){
      if (err) {
        response.send(err.message);
      }
      else {
      //This will add the cookie to allow the server to reconize the user  
        redditAPI.createSession(user.id, function(err, token){
          if (err) {
            response.status(500).send('An error occurred. Please try again later!');
          }
          else {
            response.cookie('SESSION', token); // the secret token is now in the user's cookies!
            response.cookie('username', username);
            response.redirect('/');
          }
        });
      }
    });
  } 
}); 

//---------------This is the login page
app.get('/login', function(request, response){
  var cookie = request.cookies;
  //'homepage' = pageTitle, request.loggedInUser = isLoggedIn, toHtml.homepage(posts) = content, isCreatePage, isSignup, isLogin, isHomepage
  response.send(toHtml.renderLayout('login', request.loggedInUser, toHtml.renderLoginForm(), cookie.username, false, false, true, false)); 
});

//Receiving data from our login page
//We grab POST parameters using req.body.variable_name to login the user 
/*Calling the redditAPI.checkLogin, we verify if the password matches with the username, 
if it's the case, we create a token and send it to the user in his cookies
*/
app.post(`/login`, function(request, response){
  var username = request.body.username;
  var password = request.body.password;
  if(username === '' || password === '') {
    response.send('You must provide an username and/or password');
  }
  else {
    redditAPI.checkLogin(username, password, function(err, userLoggedIn){
      if (err) {
        response.status(401).send(err.message);
      }
      else {
        //password matches with username 
        redditAPI.createSession(userLoggedIn.id, function(err, token){
          if (err) {
          response.status(500).send('An error occurred. Please try again later!');
          }
          else {
            response.cookie('SESSION', token); // the secret token is now in the user's cookies!
            response.cookie('username', username);
            response.redirect('/');
          }
        });
      }
    });
  }
});

app.get('/logout', function(request, response) {
    response.clearCookie('SESSION');
    response.clearCookie('username');
    response.redirect('/');
});

//This allows the web server to listen the requests
app.listen(process.env.PORT);

