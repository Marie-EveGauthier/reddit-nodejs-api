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

//load the path library
var path = require('path');

//load the cookie-parser library and configure express to use it as middleware. 
/*this middleware will add a `cookies` property to the request, 
an object of key:value pairs for all the cookies we set
*/
var cookieParser = require('cookie-parser');
app.use(cookieParser());


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
        request.loggedInUser = user[0].userId;
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
app.use(checkLoginToken)




/*-------------This is the homepage. 
It lists up to 25 posts, by default sorted by the newest.
The homepage resource can take a query string parameter called sort that can have the following values: new, top, hot
*/
app.get('/', function(request, response){
  
  redditAPI.getAllPosts(request.query.sort, function(err, posts){
    if (err) {
        response.status(500).send('Ooops... something went wrong. Try again later');
    }
    else {
      var listedPost = posts.map(function(post) {
        var score = post.voteScore
        return  `<li>
        <a href='/posts/${post.post_id}'>${post.post_title}</a>
        <p>Created by ${post.users_username}</p>
        <form action='/vote' method='post'>
          <input type='hidden' name='vote' value='1'>
          <input type='hidden' name='postId' value='${post.post_id}'>
          <button type='submit'>upvote this</button>
        </form>
        <p>${score}</p>
        <form action='/vote' method='post'>
          <input type='hidden' name='vote' value='-1'>
          <input type='hidden' name='postId' value='${post.post_id}'>
          <button type='submit'>downvote this</button>
        </form>
      </li>`
      }); 
      response.send(`<div id='contents'>
        <h1>Welcome on reddit</h1>
        <ul class='contents-list'>
          ${listedPost.join('')}
        </ul>
        </div>
        <div id='signup-log'>
          <form method='get' action='signup'>
            <button id='signup' type=submit>Sign up</button>
          </form>
          <form method='get' action='login'>
            <button id='login' type=submit>Login</button>
          </form>
        </div>`);
    }  
  });
});

//------This receive the vote and calling the redditAPI.createOrUpdatedVote function passes the data for the database
app.post('/vote', function(request, response){
  redditAPI.createOrUpdateVote(request.body, request.loggedInUser, function(err, result){
    if (err) {
        response.status(500).send('Ooops... something went wrong. Try again later');
      }
      else {
        //This will redirect the user where he comes from 
        response.redirect(`back`);  
      }  
  });
});


//---------------This is the create post page
app.get('/createPostPage', function(request, response) {
  response.sendFile(path.join(__dirname + '/html/postPageForm.html'), function(err){
    if (err) {
      console.log(err);
      response.status(err.status).end();
    }
    else {
      console.log('Sent:', (path.join(__dirname + '/html/postPageForm.html')));
    }
  });
});
    
//Receiving data from our postPageform
//We grab POST parameters using req.body.variable_name to insert the data of this new post in the database 

app.post('/createPostPage', function(request, response){
// before creating content, check if the user is logged in
  if (!request.loggedInUser) {
    // HTTP status code 401 means Unauthorized
    response.status(401).send('You must be logged in to create content! <a href="https://reddit-nodejs-api-marie-evegauthier.c9users.io/login">');
  }
  else {
    // here we have a logged in user, let's create the post!
    //--the request.body is an objet like this {url: xxxx, title: xxxxx}
    //the request.loggedInUser is the userId

    redditAPI.createPost(request.body, request.loggedInUser, function(err, post){
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
  redditAPI.getSinglePost(request.params.ID, function(err, posts){
    if (err) {
      response.status(500).send('Ooops... something went wrong. Try again later--post/:ID');
    }
    else {
      response.send(`<div id="postPage">
      <a href="${posts.url}"><h1>${posts.title}</h1></a>
      <p>Created by ${posts.username}</p>
      <a href='/'>Back to homepage</a>
      </div>`);
    }
  });
});


//---------------This is the signup page
app.get('/signup', function(request, response){
  response.sendFile(path.join(__dirname + '/html/signupForm.html'), function(err){
    if (err) {
      console.log(err);
      response.status(err.status).end();
    }
    else {
      console.log('Sent:', (path.join(__dirname + 'html/signupForm.html')));
    }
  });
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
      //This will redirect the user to the login page 
        response.redirect(`/login`);  
      }
    });  
  }
});

//---------------This it the login page
app.get('/login', function(request, response){
  response.sendFile(path.join(__dirname + '/html/loginForm.html'), function(err){
    if (err) {
      console.log(err);
      response.status(err.status).end();
    }
    else{
      console.log('Sent:', (path.join(__dirname + 'html/loginForm.html')));
    }
  });
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
            response.redirect('/');
          }
        });
      }
    });
  }
});

//This allows the web server to listen the requests
app.listen(process.env.PORT);


// redditAPI.createOrUpdateVote({postId: 3, userId: 1, vote: 1}, function(err, result) {
//   if (err) {
//   console.log(err);
//   }
//   else {
//     console.log(result);
//   }
// });
  


// redditAPI.getTheFiveLatestPosts(function(err, result){
// if (err) {
//   console.log(err.stack);
// }
// else {
//   console.log(result);
// }
// });

// redditAPI.getCommentsForPost(2, function(err, result){
// if (err) {
//   console.log(err.stack);
// }
// else {
//   console.log(result);
// }
// });


// redditAPI.createComment({
//   text: 'third level comment',
//   userId: 1,
//   postId: 2,
//   parentId: 14
// }, function (err, result){
//   if (err) {
//       console.log(err);
//     }
//     else {
//       console.log(result);
//     }  
//   });
  

// redditAPI.getAllPosts(function(err, result){
//   if (err) {
//       console.log(err);
//     }
//     else {
//       console.log(result);
//     }  
//   });
  

// redditAPI.createPost({
//   title: 'Why obsolescence programmee',
//   url: 'https://whyopencomputing.ch/fr/',
//   userId: 1, 
//   subredditId: 1
//   }, function(err, post) {
//   if (err) {
//     console.log(err);
//   }
//   else {
//     console.log(post);
//   }
// });

  // redditAPI.getAllSubreddits(function(err, result) {
  //   if (err) {
  //     console.log(err);
  //   }
  //   else {
  //     console.log(result);
  //   }  
  // });

    // redditAPI.createSubreddit({'name': 'may' }, function(err, result){
    //   if (err) {
    //         console.log(err);
    //       }
    //       else {
    //         console.log(result);
    //       }
    // });

// redditAPI.getAllPostsForUser(1, function(err, result){
//   if (err) {
//         console.log(err);
//       }
//       else {
//         console.log(result);
//       }
// });
// // It's request time!
// redditAPI.createUser({
//   username: 'martin',
//   password: 'poiu'
// }, function(err, user) {
//   if (err) {
//     console.log(err);
//   }
//   else {
//     redditAPI.createPost({
//       title: 'Start with why',
//       url: 'https://www.startwithwhy.com/',
//       userId: user.id
//     }, function(err, post) {
//       if (err) {
//         console.log(err);
//       }
//       else {
//         console.log(post);
//       }
//     });
//   }
// });