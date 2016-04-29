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
  
--This add a subredditId column to the posts table.
--The subredditId column references the id column of subreddits. 
--If a subreddit is deleted, the corresponding posts' subredditIds will be set NULL.
ALTER TABLE `posts` ADD COLUMN `subredditId` INT(11);
ALTER TABLE `posts` ADD FOREIGN KEY (`subredditId`) REFERENCES `subreddits`(`id`) ON DELETE SET NULL;
  

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