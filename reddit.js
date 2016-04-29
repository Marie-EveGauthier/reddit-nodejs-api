var bcrypt = require('bcrypt');
var HASH_ROUNDS = 10;

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
                  'SELECT `id`, `username`, `createdAt`, `updatedAt` FROM `users` WHERE `id` = ?', [result.insertId],
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
    createPost: function(post, subredditId, callback) {
      conn.query(
        'INSERT INTO `posts` (`userId`, `title`, `url`, `createdAt`, `subredditId`) VALUES (?, ?, ?, ?, ?)', [post.userId, post.title, post.url, null, subredditId.subredditId],
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
              'SELECT `id`,`title`,`url`,`userId`, `createdAt`, `updatedAt`, `subredditId` FROM `posts` WHERE `id` = ?', [result.insertId],
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
    getAllPosts: function(options, callback) {
      // In case we are called without an options parameter, shift all the parameters manually
      if (!callback) {
        callback = options;
        options = {};
      }
      var limit = options.numPerPage || 25; // if options.numPerPage is "falsy" then use 25
      var offset = (options.page || 0) * limit;
      
      conn.query(`
        SELECT p.id AS post_id, p.title AS post_title, p.url AS post_url, p.userId AS post_userId, p.createdAt AS post_createdAt, p.updatedAt AS post_updated, p.subredditId AS post_subredditId,
                u.id AS users_id, u.username AS users_username, u.createdAt AS users_createdAt, u.updatedAt AS users_updated,
                s.id AS subreddits_id, s.name AS subreddits_name, s.description AS subreddits_description, s.createdAt AS subreddits_createdAt, s.updatedAt AS subreddits_updatedAt
        FROM posts p
        JOIN users u ON p.userId=u.id
        JOIN subreddits s ON p.subredditId=s.id
        ORDER BY p.createdAt DESC
        LIMIT ? OFFSET ?
        `, [limit, offset],
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
    getSinglePost(postId, callback) {
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
/*   add a getAllSubreddits(callback) function. 
It should return the list of all subreddits, ordered by the newly created one first.
*/
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
    }
  };
};
