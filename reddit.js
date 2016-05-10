//load the bcrypt library to can hash the password
var bcrypt = require('bcrypt');
var HASH_ROUNDS = 10;

//load the secureRandom library that will allows us to use a big random string as session token for the cookie
var secureRandom = require('secure-random');
// this function creates a big random string
function createSessionToken() {
  return secureRandom.randomArray(100).map(code => code.toString(36)).join('');
}

module.exports = function RedditAPI(conn) {
  return {
    createUser: function(user, callback) {
      
      // first we have to hash the password...
      bcrypt.hash(user.password, HASH_ROUNDS, function(err, hashedPassword) {
        if (err) {
          callback(err);
        }
        else {
          conn.query(
            'INSERT INTO `users` (`username`,`password`, `createdAt`) VALUES (?, ?, ?)', [user.username, hashedPassword, null],
            function(err, result) {
              if (err) {
                /*
                There can be many reasons why a MySQL query could fail. While many of
                them are unknown, there's a particular error about unique usernames
                which we can be more explicit about!
                */
                if (err.code === 'ER_DUP_ENTRY') {
                  callback(new Error('A user with this username already exists'));
                }
                else {
                  callback(err);
                }
              }
              else {
                /*
                Here we are INSERTing data, so the only useful thing we get back
                is the ID of the newly inserted row. Let's use it to find the user
                and return it
                */
                conn.query(
                  'SELECT `id`, `username`, `password`, `createdAt`, `updatedAt` FROM `users` WHERE `id` = ?', [result.insertId],
                  function(err, result) {
                    if (err) {
                      callback(err);
                    }
                    else {
                      /*
                      Finally! Here's what we did so far:
                      1. Hash the user's password
                      2. Insert the user in the DB
                      3a. If the insert fails, report the error to the caller
                      3b. If the insert succeeds, re-fetch the user from the DB
                      4. If the re-fetch succeeds, return the object to the caller
                      */
                        callback(null, result[0]);
                    }
                  }
                );
              }
            }
          );
        }
      });
    },
    createPost: function(post, userId, callback) {
      if(post.url === '' || post.title === '') {
        callback(new Error('You need to specify the title and/or the url'))
      }
      else {
        var url = post.url.toLowerCase();
        conn.query(
          'INSERT INTO `posts` (`userId`, `title`, `url`, `createdAt`) VALUES (?, ?, ?, ?)', [userId, post.title, url, null],
          function(err, result) {
            if (err) {
              callback(err);
            }
            else {
              /*
              Post inserted successfully. Let's use the result.insertId to retrieve
              the post and send it to the caller!
              */
              conn.query(
                'SELECT `id`,`title`,`url`,`userId`, `createdAt`, `updatedAt` FROM `posts` WHERE `id` = ?', [result.insertId],
                function(err, result) {
                  if (err) {
                    callback(err);
                  }
                  else {
                    callback(null, result[0]);
                  }
                }
              );
            }
          }
        );
      }
    },
    getAllPosts: function(sortingMethod, callback) {
      if (!sortingMethod || sortingMethod === 'new') {
      /*In case we are called without an options parameter, shift all the parameters manually
      if (!callback) {
        callback = options;
        options = {};
      }
      var limit = options.numPerPage || 25; // if options.numPerPage is "falsy" then use 25
      var offset = (options.page || 0) * limit;
      */
      
        conn.query(`
          SELECT p.id AS post_id, p.title AS post_title, p.url AS post_url, p.userId AS post_userId, p.createdAt AS post_createdAt, p.updatedAt AS post_updated, p.subredditId AS post_subredditId,
                u.id AS users_id, u.username AS users_username,
                SUM(if(v.vote > 0, 1, 0)) AS upvotes, SUM(if(v.vote < 0, -1, 0)) AS downvotes, SUM(v.vote) AS voteScore
          FROM posts p
          JOIN users u ON p.userId=u.id
          LEFT JOIN votes v ON v.postId=p.id
          GROUP BY p.id
          ORDER BY p.createdAt DESC
          LIMIT 25
          `,
          function(err, results) {
            if (err) {
              callback(err);
            }
            else {
              callback(null, results);
            }
          }
        );
      }
      /*
      Top ranking: = voteScore
      With sortingMethod equal to top, we join the posts table and the vote tables.
      This way,we create a new column called voteScore that is the SUM of all the votes. 
      By ordering the select post by the value of this voteScore column descending, we obtain the "top" posts first.
    */
    else if (sortingMethod === 'top') {
      conn.query(`
          SELECT p.id AS post_id, p.title AS post_title, p.url AS post_url, p.userId AS post_userId, p.createdAt AS post_createdAt, p.updatedAt AS post_updated, p.subredditId AS post_subredditId,
          u.id AS users_id, u.username AS users_username,
          SUM(v.vote) AS voteScore       
          FROM posts p
          JOIN votes v ON v.postId=p.id 
          JOIN users u ON p.userId=u.id
          GROUP BY p.id
          ORDER BY voteScore DESC
          LIMIT 25
          `,
          function(err, results) {
            if (err) {
              callback(err);
            }
            else {
              callback(null, results);
            }
          }
        );
      }
      //Hotness ranking: = voteScore / (amount of time the post has been online)
      else if (sortingMethod === 'hot') {
        conn.query(`
          SELECT p.id AS post_id, p.title AS post_title, p.url AS post_url, p.userId AS post_userId, p.createdAt AS post_createdAt, p.updatedAt AS post_updated, p.subredditId AS post_subredditId,
          u.id AS users_id, u.username AS users_username,
          SUM(v.vote) AS voteScore, 
          SUM(v.vote) / TIMEDIFF(NOW(),p.createdAt) AS hotnessScore    
          FROM posts p
          JOIN votes v ON v.postId=p.id 
          JOIN users u ON p.userId=u.id
          GROUP BY p.id
          ORDER BY hotnessScore DESC
          LIMIT 25
          `,
          function(err, results) {
            if (err) {
              callback(err);
            }
            else {
              callback(null, results);
            }
          }
        );
      }
      //Controversial ranking: = numUpvotes < numDownvotes ? totalVotes * (numUpvotes / numDownvotes) : totalVotes * (numDownvotes / numUpvotes)
      else if (sortingMethod === 'controversial'){
        conn.query(`
        SELECT p.id AS post_id, p.title AS post_title, p.url AS post_url, p.userId AS post_userId, p.createdAt AS post_createdAt, p.updatedAt AS post_updated, p.subredditId AS post_subredditId,
        u.id AS users_id, u.username AS users_username,
        SUM(v.vote) AS voteScore,
        if(SUM(if(v.vote > 0, 1, 0)) < SUM(if(v.vote < 0, -1, 0)), SUM(v.vote) * (SUM(if(v.vote > 0, 1, 0)) / SUM(if(v.vote < 0, -1, 0))), SUM(v.vote) * (SUM(if(v.vote < 0, -1, 0)) / SUM(if(v.vote > 0, 1, 0)))) AS controversialScore
        FROM posts p
        JOIN users u ON p.userId=u.id
        LEFT JOIN votes v ON v.postId=p.id
        GROUP BY p.id
        ORDER BY controversialScore DESC
        LIMIT 25
        `,  
        function(err, results){
          if(err){
            callback(err);
          }
          else{
            callback(null, results);
          }
        }
        );     
      }
    },
    getAllPostsForUser: function(userId, options, callback) {
      // In case we are called without an options parameter, shift all the parameters manually
      if (!callback) {
        callback = options;
        options = {};
      }
      var limit = options.numPerPage || 25; // if options.numPerPage is "falsy" then use 25
      var offset = (options.page || 0) * limit;
      
      conn.query(
        `SELECT p.id AS post_id, p.title AS post_title, p.url AS post_url, p.userId AS post_userId, p.createdAt AS post_createdAt, p.updatedAt AS post_updated, 
                u.id AS users_id, u.username AS users_username, u.createdAt AS users_createdAt, u.updatedAt AS users_updated
        FROM posts p
        JOIN users u ON p.userId=u.id
        WHERE p.userId=${userId}
        ORDER BY p.createdAt DESC
        LIMIT ? OFFSET ?`
        , [limit, offset],
        function(err, results) {
          if (err) {
            callback(err);
          }
          else {
            var resultsFormated = {
              userId: results[0].users_id,
              username: results[0].users_username,
              createdAt: results[0].users_createdAt,
              updatedAt: results[0].users_updated,
              post: results.map(function(res) {
                return {
                id: res.post_id,
                title: res.post_title,
                url: res.post_url,
                createdAt: res.post_createdAt,
                updatedAt: res.post_updated,
                };
              })
            };
            callback(null, resultsFormated);
          }
        }
      );
    },
    getSinglePost: function(postId, callback) {
      conn.query(
      `SELECT p.id AS post_id, p.title AS post_title, p.url AS post_url, p.userId AS post_userId, p.createdAt AS post_createdAt, p.updatedAt AS post_updated,
      u.id AS users_id, u.username AS users_username
      FROM posts p
      JOIN users u ON p.userId=u.id
      WHERE p.id=${postId}`
      ,function(err, result) {
        if (err) {
          callback(err);
        }
        else {
          callback(null, {
            postId: result[0].post_id,
            title: result[0].post_title,
            url: result[0].post_url,
            postCreatedAt: result[0].post_createdAt,
            postUpdatedAt: result[0].post_updated,
            userId: result[0].users_id,
            username: result[0].users_username
            });
          }
        }
      );
    },
    createSubreddit: function(sub, callback) {
      conn.query(
        'INSERT INTO `subreddits` (`name`, `description`, `createdAt`) VALUES (?, ?, ?)', [sub.name, sub.description, null],
        function(err, result) {
          if (err) {
            callback(err);
          }
          if (err) {
            /*
            There can be many reasons why a MySQL query could fail. While many of
            them are unknown, there's a particular error about unique names
            which we can be more explicit about!
            */
            if (err.code === 'ER_DUP_ENTRY') {
              callback(new Error('A subreddit with this name already exists'));
            }
            else {
              callback(err);
            }
          }
          else {
            /*
            Subreddit inserted successfully. Let's use the result.insertId to retrieve
            the post and send it to the caller!
            */
            conn.query(
              'SELECT `name`,`description` FROM `subreddits` WHERE `id` = ?', [result.insertId],
              function(err, result) {
                if (err) {
                  callback(err);
                }
                else {
                  callback(null, result[0]);
                }
              }
            );
          }
        }
      );
    },
//This returns the list of all subreddits, ordered by the newly created one first.
    getAllSubreddits: function(callback) {
      conn.query(`
        SELECT s.id AS subreddits_id, s.name AS subreddits_name, s.description AS subreddits_description, s.createdAt AS subreddits_createdAt, s.updatedAt AS subreddits_updated
        FROM subreddits s
        ORDER BY s.createdAt DESC`,
        function(err, results) {
          if (err) {
            callback(err);
          }
          else {
            var resultsFormated = results.map(function(res){
              return {
                id: res.subreddits_id,
                name: res.subreddits_name,
                description: res.subreddits_description,
              };
            });
            callback(null, resultsFormated);
          }
        }
      );
    },
    createComment: function(comment, callback) {
      conn.query(
        'INSERT INTO `comments` (`text`, `userId`, `postId`, `parentId`, `createdAt`) VALUES (?, ?, ?, ?, ?)', [comment.text, comment.userId, comment.postId, comment.parentId, null],
        function(err, result) {
          if (err) {
            callback(err);
          }
          else {
            /*
            Comment inserted successfully. Let's use the result.insertId to retrieve
            the comment and send it to the caller!
            */
            conn.query(
              'SELECT `id`,`text`,`userId`, `postId`, `parentId`, `createdAt`, `updatedAt` FROM `comments` WHERE `id` = ?', [result.insertId],
              function(err, result) {
                if (err) {
                  callback(err);
                }
                else {
                  callback(null, result[0]);
                }
              }
            );
          }
        }
      );
    },
    getCommentsForPost: function(postId, callback) {
      conn.query(`
        SELECT c1.id AS c1_id, c1.text AS c1_text, c1.userId AS c1_userId, c1.createdAt AS c1_createdAt, c1.updatedAt AS c1_updatedsAt, c1.parentId AS c1_parentId,
        c2.id AS c2_id, c2.text AS c2_text, c2.userId AS c2_userId, c2.createdAt AS c2_createdAt, c2.updatedAt AS c2_updatedsAt, c2.parentId AS c2_parentId,
        c3.id AS c3_id, c3.text AS c3_text, c3.userId AS c3_userId, c3.createdAt AS c3_createdAt, c3.updatedAt AS c3_updatedsAt, c3.parentId AS c3_parentId
        FROM comments c1
        LEFT JOIN comments c2 ON c1.id=c2.parentId
        LEFT JOIN comments c3 ON c2.id=c3.parentId
        WHERE c1.postId =${postId} AND c1.parentId IS NULL`,
        function(err, result) {
                if (err) {
                  callback(err);
                }
                else {
                  var arrOfComments = [];
                  var parentIdNull = result.filter(function(comment){
                    if(result.c2_id === null){
                      return true;
                      //arrOfComments.push({id: comment.c1_id, text: comment.c1_text, createdAt: comment.c1_createdAt, updatedAt: comment.c1_updatedAt});
                    }
                    return arrOfComments;
                    //else if () {
                      
                    //}
                    
                  });
                  
                  
                  callback(null, result);
                }
        }
      );
  },
  /* retrieve the latest 5 posts by createdAt date, including the username who created the content.
  */
  getTheFiveLatestPosts: function(callback) {
      conn.query(`
        SELECT p.id AS post_id, p.title AS post_title, p.url AS post_url, p.userId AS post_userId, p.createdAt AS post_createdAt, p.updatedAt AS post_updated, p.subredditId AS post_subredditId,
                u.id AS users_id, u.username AS users_username, u.createdAt AS users_createdAt, u.updatedAt AS users_updated,
                s.id AS subreddits_id, s.name AS subreddits_name, s.description AS subreddits_description, s.createdAt AS subreddits_createdAt, s.updatedAt AS subreddits_updatedAt
        FROM posts p
        JOIN users u ON p.userId=u.id
        JOIN subreddits s ON p.subredditId=s.id
        ORDER BY p.createdAt DESC
        LIMIT 5`,
        function(err, results) {
          if (err) {
            callback(err);
          }
          else {
            var resultsFormated = results.map(function(res){
              return {
                postId: res.post_id,
                title: res.post_title,
                url: res.post_url,
                createdAt: res.post_createdAt,
                updatedAt: res.post_updated,
                userId: res.post_userId,
                user: {
                  id: res.users_id,
                  username: res.users_username,
                  createdAt: res.users_createdAt,
                  updatedAt: res.users_updated
                },
                subreddit: {
                  id: res.subreddits_id,
                  name: res.subreddits_name,
                  description: res.subreddits_description, 
                  createdAt: res.subreddits_createdAt,
                  updatedAt: res.subreddits_updatedAt
                }
              };
            });
            callback(null, resultsFormated);
          }
        }
      );
    },
    /*
    This function will take a vote object with postId, userId, vote. 
    It makes sure that the three proprieties are given and  that the vote is either 1, 0 (to cancel a vote) or -1.
    Otherwise it should reject the request.
*/
    createOrUpdateVote: function(vote, userId, callback) {
      var valueOfVote = vote.vote;
      var postId = vote.postId;
      conn.query(`
        INSERT INTO votes
        SET postId=${postId}, userId=${userId}, vote=${valueOfVote} ON DUPLICATE KEY UPDATE vote=${valueOfVote};`,
        function(err, results) {
          if (err) {
            callback(err);
          }
          else {
            callback(null, 'vote completed');
          }
        }
      );  
    },
/*This checkLogin function queries the database to verify if the input (username and password) matches.
As the password is hashed, we have to use bcrypt.compare function. 
If it returns false, that means the data doesn't match and then, the function callback with an error.
Otherwise, It will return true because the data matches. So, the function callbacks with the user
*/
    checkLogin: function(username, password, callback){
      conn.query(`SELECT * FROM users WHERE username=?`, [username], 
      function(err, result){
        if(err){
          callback(err);
        }
        else{
            if (result.length === 0) {
              callback(new Error('username or password incorrect --username')); // in this case the user doesn't exist
            }
            else {
            var userExisting= result[0];
            var actualHashedPassword = userExisting.password;
            //
            bcrypt.compare(password, actualHashedPassword, function(err, result) {
              if(result === true) { // let's be extra safe here
                callback(null, userExisting);
              }
              else {
                callback(new Error('username or password incorrect --password')); // in this case the password is wrong, but we reply with the same error
              }
            });
          }
        }
      });
    },
//This function uses the big random number generated calling createSessiontoken and then store it in the sessions table with the userId  
    createSession: function(userId, callback) {
      var token = createSessionToken();
      conn.query(`
      INSERT INTO sessions SET userId = ?, sessionToken = ?`, [userId, token], 
      function(err, result) {
        if (err) {
        callback(err);
        }
        else {
          callback(null, token); // this is the secret session token :)
        }
      });
    },
    // This function checks if there is an userId associated to the sessionToken in the database.If it finds it, it callbacks it
    getUserFromSession: function(sessionToken, callback) {
      conn.query(`
      SELECT * FROM sessions WHERE sessionToken = ?`, [sessionToken],
      function(err, result) {
        if (err) {
          callback(err);
        }
        else {
          //result is an array with an objet looking like this: {sessionToken: xxx , userId: xxx} 
          callback(null, result);
        }
      });
    }
  };
};
