-- This creates the users table. The username field is constrained to unique
-- values only, by using a UNIQUE KEY on that column
CREATE TABLE `users` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(50) NOT NULL,
  `password` VARCHAR(60) NOT NULL, -- why 60??? ask me :)
  `createdAt` TIMESTAMP NOT NULL DEFAULT 0,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- This creates the posts table. The userId column references the id column of
-- users. If a user is deleted, the corresponding posts' userIds will be set NULL.
CREATE TABLE `posts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(300) DEFAULT NULL,
  `url` varchar(2000) DEFAULT NULL,
  `userId` int(11) DEFAULT NULL,
  `createdAt` TIMESTAMP NOT NULL DEFAULT 0,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `userId` (`userId`),
  CONSTRAINT `posts_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
--This adds a subredditId column to the posts table.
--The subredditId column references the id column of subreddits. 
--If a subreddit is deleted, the corresponding posts' subredditIds will be set NULL.
ALTER TABLE `posts` ADD COLUMN `subredditId` INT(11);
ALTER TABLE `posts` ADD FOREIGN KEY (`subredditId`) REFERENCES `subreddits`(`id`) ON DELETE SET NULL;
ALTER TABLE `posts` ADD COLUMN 
ALTER TABLE posts MODIFY url  varchar (300) NOT NULL;   
ALTER TABLE posts MODIFY title  varchar (300) NOT NULL;  


-- This creates the subreddits table. The name field is constrained to unique
-- values only, by using a UNIQUE KEY on that column
CREATE TABLE `subreddits` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(30) NOT NULL,
  `description` varchar(200) DEFAULT NULL,
  `createdAt` TIMESTAMP NOT NULL DEFAULT 0,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
);
  


--This creates the comments table. 
--A top-level comment has parentId set to NULL
CREATE TABLE `comments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `createdAt` TIMESTAMP NOT NULL DEFAULT 0,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `text` varchar(10000) NOT NULL,
  `userId` int(11),
  `postId` int(11),
  `parentId` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
);

--The userId column references the id column of users. 
--If a user is deleted, the corresponding comments' userId will be set NULL.
ALTER TABLE `comments` ADD FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL;

--The postId column references the id column of posts. 
--If a post is deleted, the corresponding comments' postId will be set NULL.
ALTER TABLE `comments` ADD FOREIGN KEY (`postId`) REFERENCES `posts`(`id`) ON DELETE SET NULL;

--The parentId column references the id column of comments (i.e the parentId is the id of the comment it is replying to.) 
--If a comment is deleted, the corresponding comments' parentId will be set NULL.
ALTER TABLE `comments` ADD FOREIGN KEY (`parentId`) REFERENCES `comments`(`id`) ON DELETE SET NULL;

--This creates the votes table. This is a join table between userId and postId.
--In the vote column, the value of 1 signifies an upvote, and a value of -1 signifies a downvote 
CREATE TABLE `votes` (
  `userId` int(11), 
  `postId` int(11), 
  PRIMARY KEY (`userId`, `postId`),
  `votes` TINYINT,
  `createdAt` TIMESTAMP NOT NULL DEFAULT 0,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
ALTER TABLE `votes` ADD FOREIGN KEY (`userId`) REFERENCES `users`(`id`);
ALTER TABLE `votes` ADD FOREIGN KEY (`postId`) REFERENCES `posts`(`id`);
ALTER TABLE `votes` MODIFY vote  TINYINT (4) NOT NULL DEFAULT 0;  


--This creates a sessions table. We will populate it each team a user successfully logs in.
CREATE TABLE `sessions` (
  `sessionToken` varchar(255) NOT NULL,
  `userId` int(11) NOT NULL
);
ALTER TABLE `sessions` ADD FOREIGN KEY (userId) REFERENCES `users`(`id`);

--To calculate the controversial rannking
numUpvotes < numDownvotes ? totalVotes * (numUpvotes / numDownvotes) : totalVotes * (numDownvotes / numUpvotes)
if(SUM(if(v.vote > 0, 1, 0)) < SUM(if(v.vote < 0, -1, 0)), SUM(v.vote) * (SUM(if(v.vote > 0, 1, 0)) / SUM(if(v.vote < 0, -1, 0))), SUM(v.vote) * (SUM(if(v.vote < 0, -1, 0)) / SUM(if(v.vote > 0, 1, 0))))

numUpvotes= SUM(if(v.vote > 0, 1, 0))
numDownvotes= SUM(if(v.vote < 0, -1, 0))
totalVotes= SUM(v.vote)


`SELECT p.id AS post_id, p.title AS post_title, p.url AS post_url, p.userId AS post_userId, p.createdAt AS post_createdAt, p.updatedAt AS post_updated, p.subredditId AS post_subredditId,
u.id AS users_id, u.username AS users_username,
if(SUM(if(v.vote > 0, 1, 0)) < SUM(if(v.vote < 0, -1, 0)), SUM(v.vote) * (SUM(if(v.vote > 0, 1, 0)) / SUM(if(v.vote < 0, -1, 0))), SUM(v.vote) * (SUM(if(v.vote < 0, -1, 0)) / SUM(if(v.vote > 0, 1, 0)))) AS controversialScore
FROM posts p
JOIN users u ON p.userId=u.id
LEFT JOIN votes v ON v.postId=p.id
GROUP BY p.id
ORDER BY controversialScore DESC
LIMIT 25`;
          


if(SUM(if(v.vote > 0, 1, 0)) AS upvotes)          