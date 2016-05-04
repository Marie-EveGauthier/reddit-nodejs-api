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

/*This is the homepage. It lists up to 25 posts, by default sorted by the newest.
The homepage resource can take a query string parameter called sort that can have the following values: new, top, hot
*/
app.get('/', function(request, response){
  
  redditAPI.getAllPosts(request.query.sort, function(err, posts){
    
    if (err) {
        response.status(500).send('Ooops... something went wrong. Try again later');
    }
    else {
      var listedPost = posts.map(function(post) {
        return  `<li>
        <a href=${post.post_url}>${post.post_title}</a>
        <p>Created by ${post.users_username}</p>
        </li>`
      }); 
      response.send(`<div id="contents">
        <h1>Welcome on reddit</h1>
        <ul class="contents-list">
          ${listedPost.join('')}
        </ul>
        </div>
        <div id="signup-log">
          <button id="signup" type=submit>Sign up</button>
        </div>`);
    }  
  });
});

//This is the create post page
app.get('/createPostPage', function(request, response) {
  response.sendFile(path.join(__dirname + '/postPageForm.html'), function(err){
    if (err) {
      console.log(err);
      response.status(err.status).end();
    }
    else {
      console.log('Sent:', (path.join(__dirname + '/postPageForm.html')));
    }
  });
});
    
//Receiving data from our postPageform
//We grab POST parameters using req.body.variable_name to insert the data of this new post in the database 

app.post('/createPostPage', function(request, response){
  var url = request.body.url;
  var title = request.body.title;
  redditAPI.createPost(request.body, function(err, post){
    if (err) {
      response.status(500).send('Ooops... something went wrong. Try again later--createPostPage');
    }
    else {
      //This will redirect the user to the newly created posts according to its id
      response.redirect(`/posts/${post.id}`);  
    }  
  });
});

//This shows the post according to the id given as parameter in the url
app.get('/posts/:ID', function(request, response){
  redditAPI.getSinglePost(request.params.ID, function(err, posts){
    if (err) {
      response.status(500).send('Ooops... something went wrong. Try again later--post/:ID');
    }
    else {
      response.send(`<div id="postPage">
      <a href=${posts.url}><h1>${posts.title}</h1></a>
      <p>Created by ${posts.username}</p>
      </div>`);
    }
  });
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