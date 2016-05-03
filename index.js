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

/*The homepage lists up to 25 posts, by default sorted by descending "hotness" (more on that later). 
The homepage is accessible at the / resource path. 
But in addition to showing the top 25 "hot" posts, 
the homepage resource can take a query string parameter called sort that can have the following values:
*/

//This is the homepage
app.get('/', function(request, response){
  redditAPI.getAllPosts(function(err, posts){
    
    if (err) {
        response.status(500).send('Ooops... something went wrong. Try again later');
    }
    else {
      var listedPost = posts.map(function(post) {
        return  `<li>
        <a href=${post.url}>${post.title}</a>
        <p>Created by ${post.user.username}</p>
        </li>`
      }); 
      response.send(`<div id="contents">
        <h1>Welcome on reddit</h1>
        <ul class="contents-list">
          ${listedPost.join('')}
        </ul>
        </div>`);
    }  
  });
});

//This is the homepage with sort method
app.get('/:sort', function(request, response){
  var sort = request.params.sort;
  redditAPI.getAllPosts(function(err, result){
    
    if (err) {
        response.status(500).send('Ooops... something went wrong. Try again later');
    }
    else {
    response.send(result);
    }  
  });
});


//This allows the web server to listen the requests
app.listen(process.env.PORT);


redditAPI.createOrUpdateVote({postId: 3, userId: 1, vote: 1}, function(err, result) {
  if (err) {
  console.log(err);
  }
  else {
    console.log(result);
  }
});
  


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