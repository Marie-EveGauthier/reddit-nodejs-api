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


//`text`, `userId`, `postId`, `parentId`,
redditAPI.createComment({
  text: 'third level comment',
  userId: 1,
  postId: 2,
  parentId: 14
}, function (err, result){
  if (err) {
      console.log(err);
    }
    else {
      console.log(result);
    }  
  });
  

// redditAPI.getAllPosts(function(err, result){
//   if (err) {
//       console.log(err);
//     }
//     else {
//       console.log(result);
//     }  
//   });
  

// redditAPI.createPost({
//   title: 'St-Charles Public Library ',
//   url: 'http://www.ville.montreal.qc.ca/culture/en/saint-charles-public-library',
//   userId: 1}, {subredditId: 4}, function(err, post) {
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