# Reddit NodeJS API

In this project, we're going to create a set of functions -- an API -- that will be used to build a full Reddit clone next week. The functions that we create will be doing what is commonly called "CRUD".

CRUD stands for "Create, Read, Update, Delete". It's the basic set of operations that we normally want to do on the entities of our application. For example, when you initially go to Reddit, one thing you might want to do is signup. Signing up should add a new entry to the `users` table in Reddit's database. In the code of `reddit.js`, this is the role of the `createUser` function: take a simple object with user's properties, make database queries to create the user, and return the `id` of the newly created user since it's the database that creates it.

We won't be building a *Web* API yet. This will be the topic of next week, where we will explore using the ExpressJS framework to create a web server with NodeJS. Next week, our web server code will use the code that we are creating in this workshop to talk to the database indirectly. This is preferable to making sql queries directly inside our web server code. If we ever make changes to our SQL schema or rules, we only have to change `reddit.js` and not the code that uses it.

The project has already been initialized with a few files to get you started.

* `reddit.sql`: This file contains `CREATE TABLE` statements for the `users` and `posts` tables to get you started. You should add any further `CREATE TABLE`s from the workshop in this file.
* `reddit.js`: This file contains the actual Reddit API. The only things that should be in there are functions that talk to the database.
* `demo-using-api.js`: Basically, this file is a scratchpad. It is an **example** of how to use the Reddit API. First we have to create a database connection. Then use `new Reddit()` and pass it the connection. This will return an API object that has all the CRUD functions we need -- `createUser`, `createPost`, `getAllPosts`. We then show an example of using the API to create a new user. Once we receive the new user's ID, we use it to create a new post under that user. Finally, we print the new post ID in the console. As you are implementing the new functionality for this workshop, you can test your functions by calling them inside `demo-using-api.js` after commenting out the already existing code.

In the next section, we will review in detail the contents of `reddit.js` and `demo-using-api.js`.

## Initial files

### `reddit.sql`
This file contains `CREATE TABLE` statements for the `users` and `posts` tables to get you started. You should add any further `CREATE TABLE`s from the workshop in this file.

### `demo-using-api.js`
This will look like the "main" file of our application, meaning it's the one we will run to get things done. First, we load the `mysql` NodeJS library. This library will let us communicate with MySQL similarly to what we have been doing with the command-line: writing queries and getting responses.

Next, we create a connection to a MySQL server. On Cloud9, our database does not need to be 100% secure, so we are setup with a MySQL server that we can login to with our Cloud9 username and no password. The connection is using the `reddit` database, which we haven't created yet.

After that, we load the `./reddit` module, which exports a single function: the reason for this is that all the functions of our API require a database connection. Instead of establishing the database connection inside the `reddit.js` file, we choose to keep it pure: we pass the connection to the function, and it returns to us the actual API. This is a common pattern in development. This is a good time to make sure you understand what is going on, and ask questions if not.

Finally, after having initialized the API, we can start doing ad-hoc requests to it. In the current example, we are creating a new user, then using its `id` to create a new post.

### `reddit.js`
This is the core file of the project. It exports a class `RedditAPI`. We can call the constructor by providing a `node-mysql` database connection object. The object will have the following functions:

#### `createUser`
The first function we see being exported is `createUser`. It takes an object of user properties, and returns a Promise. As we can see from the code of the function, the `user` argument needs to have a `username` and a `password`.

The first thing our `createUser` function does is "hash" the user's password using the `bcrypt` library. This step is necessary to protect our users' information. **It is computationaly infeasible to recover the actual password from the hash**. The way this works is that when the user logs in, we hash the provided password using the same function. If both hashes match, then it's a success. Otherwise we can safely say it's the wrong password. We will be looking at hashing in more detail next week.

Once the hashing is completed, we get back the hashed password through the `Promise`. We use the hashed password to do an `INSERT` in our database.

Another thing you will notice is the `?`s in the SQL query. These placeholders are **super important**. First off, they make it so that we don't have to concatenate strings together for every parameter in the query. But more importantly, they will make sure to **properly escape** any string we give to them. To make this work, we pass the `conn.query` function an array of the strings that should replace the `?`s, and it puts the query together for us.

When this function succeeds, it calls back with the new user ID.

#### `createPost`
This works similarly to the `createUser` function, except we don't need the password hashing step. The `post` argument needs to have a `userId`, `title` and `url`. 

When this function succeeds, it calls back with the new post ID.

#### `getAllPosts`
This function is different from the previous two in that it doesn't add any data to our system. It uses a regular `SELECT` to retrieve all the posts, with a `LIMIT` of 25. Eventually, pagination can be added to retrieve the next set of 25 results, or change the size of each page.

When this function succeeds, it calls back with an array of objects. Each object represents a post in the database. In this initial version, the posts are always ordered by `createdAt DESC`, which means newer posts will appear at the top of the result set.

## Building out the API
Your work will consist in incrementally adding features to the API to make it more complete. Most of the features are independent, so they can be worked on separately. If you want to work on more than one feature at a time, it would be a good idea to create a branch for each feature until you are ready to merge it to master.

### Improve the `getAllPosts` function
At the moment, the `getAllPosts` function is returning an array of posts, which is exactly what we want. The problem is that it's hard to figure out the username associated to each post. Since our database schema is **normalized**, the posts table only contains a **reference** to the users table, through the `userId` column. Your job is to improve this function by returning the user associated with each post.

For example, instead of returning:

```json
[
    {
        "id": 1,
        "title": "hi reddit!",
        "url": "https://www.noob.com",
        "createdAt": "...",
        "updatedAt": "...",
        "userId": 1
    }
]
```

You should return:

```json
[
    {
        "id": 42,
        "title": "hi reddit!",
        "url": "https://www.noob.com",
        "createdAt": "...",
        "updatedAt": "...",
        "user": {
            "id": 1,
            "username": "n00bster",
            "createdAt": "...",
            "updatedAt": "..."
        }
    }
]
```

You can achieve this by adding a `JOIN` to the existing query, then **transforming** the flat array you get back using a `map`.

**Note**: MySQL cannot return a nested dataset. The result of your join will still be an array of flat objects. you will have to use the `map` method to return the data in the expected format.

### Add a subreddits functionality
This feature will be more complicated to implement, because it will require not only adding new functions, but also modifying existing ones.

#### Step 1:
The first step will be to create a `subreddits` table. Each subreddit should have a unique, auto incrementing `id` that is also the primary key, a `name` anywhere from 1 to 30 characters, and an optional `description` of up to 200 characters. Each sub should also have `createdAt` and `updatedAt` `DATETIME` fields. To guarantee the integrity of our data, we should make sure that the `name` column is **unique** by using a `UNIQUE INDEX`. There should never be two subreddits with the same `name`.

Once you write the correct `CREATE TABLE` statement, add it to `reddit.sql` and execute it to create the table.

#### Step 2:
Then we need to add a `subredditId` column to the posts table, because now each post will be related to a subreddit. There are two ways to do this: either with an `ALTER TABLE`, or by `DROP`ping and recreating the table. Here we will choose to do it with an `ALTER TABLE`.

Write an `ALTER TABLE` query that will add a `subredditId INT` column to the `posts` table, as well as a foreign key constraining its values to valid `id`s in the `subreddits` table you just created.

Once you write the correct `ALTER TABLE` statement, add it to `reddit.sql` and execute it to modify the table.

#### Step 3:
In the `reddit.js` API, add a `createSubreddit(subreddit)` function. It should take a subreddit object that contains a `name` and `description`. It should insert the new subreddit, and return the ID of the new subreddit. You can take some inspiration from the `createUser` function which operates in a similar way. Just like for `createUser`, you'll have to check if you get a "duplicate entry" error and send a more specific error message.

#### Step 4:
In the `reddit.js` API, add a `getAllSubreddits()` function. It should return the list of all subreddits, ordered by the newly created ones first, as a `Promise`.

#### Step 5:
In the `reddit.js` API, modify the `createPost` function to look for a `subredditId` property in the `post` object and use it. `createPost` should return an error if `subredditId` is not provided.

#### Step 6
In the `reddit.js` API, modify the `getAllPosts` function to return the **full subreddit** associated with each post. You will have to do an extra `JOIN` to accomplish this.

### Add the voting system for posts
Reddit wouldn't be what it is without its voting system. The mix of up/down votes and good scoring functions makes it possible to view the world of Reddit from all kinds of points of view.

To make the rest of the instructions clearer, let's define some terms that are proper to us and that describe the vote parameters and scoring functions. Note that the scoring functions are made for simplicity and not accuracy.

* **`numUpvotes`**: The number of upvotes for a given post
* **`numDownvotes`**: The number of downvotes for a given post
* **`totalVotes`**: `= numUpvotes + numDownvotes`
* **`voteScore`**: `= numUpvotes - numDownvotes`
* **Top ranking**: `= voteScore`
* **Hotness ranking**: `= voteScore / (amount of time the post has been online in seconds.)` -- if two posts have a `voteScore` of 100, the post that has been online the least amount of time is hotter because it received those votes faster.
* **Newest ranking**: `= createdAt`

#### Step 1:
Add a `votes` table to your database. The way our `votes` table will be setup is often referred to as a "join table". Its goal is to allow a many-to-many relation between the `posts` and `users` tables. In this case, a single user can vote on many posts, and a single post can be voted on by many users.

When creating the `votes` table, the primary key will be set to the pair `(postId, userId)`. This will ensure that a single user can only vote once on the same post. It will do so by disallowing queries that would introduce a pair that already exists in the database. It's common for a join table to not have its own automatically incrementing, unique ID. To accomplish this you can simply write `PRIMARY KEY (userId, postId)` in your `CREATE TABLE`. Finally, each of these two ID columns will need a foreign key referencing their respective tables.

In addition to the two ID columns, the `votes` table will need a `voteDirection` column which can be set to `TINYINT`. It will take the value of `1` to signify an upvote, and a value of `-1` to signify a downvote. This way, when we `GROUP BY postId`, we can do a `SUM` over the `voteDirection` column and easily get the `voteScore` for each post we are interested in. We will also add `createdAt` and `updatedAt` columns to this table.

Since the create table statement is a bit different from the others, we will provide it to you. Note that this type of table is very common for many-to-many relations.

```sql
CREATE TABLE votes (
  userId INT,
  postId INT,
  voteDirection TINYINT,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL,
  PRIMARY KEY (userId, postId), -- this is called a composite key because it spans multiple columns. the combination userId/postId must be unique and uniquely identifies each row of this table.
  KEY userId (userId), -- this is required for the foreign key
  KEY postId (postId), -- this is required for the foreign key
  FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE, -- CASCADE means also delete the votes when a user is deleted
  FOREIGN KEY (postId) REFERENCES posts (id) ON DELETE CASCADE, -- CASCADE means also delete the votes when a post is deleted
);

```

#### Step 2:
Add a function called `createVote(vote)` to your Reddit API. This function will take a `vote` object with `postId`, `userId`, `voteDirection`.
Your function should make sure that the `voteDirection` is either `1`, `0` (to cancel a vote) or `-1`. If it's different, your function should return an error.

If we do the query with a regular `INSERT` we can run into errors. The first time a user votes on a given post will pass. But if they try to change their vote direction, the query will fail because we would be trying to insert a new vote with the same `postId`/`userId`. One way to fix this would be to first check if the user has already voted on a post by doing a `SELECT`, and `UPDATE` the corresponding row if they have. But SQL gives us a better way to do that: [`ON DUPLICATE KEY UPDATE`](https://dev.mysql.com/doc/refman/5.7/en/insert-on-duplicate.html). With it, we can write our voting query like this:

```sql
INSERT INTO votes SET postId=?, userId=?, voteDirection=? ON DUPLICATE KEY UPDATE voteDirection=?;
```
This way, the first time user#1 votes for post#1, a new row will be created. If they change their mind and send a different vote for the same post, then the `voteDirection` column of the same row will be updated instead.

#### Step 3:
Go back to your `getAllPosts` function. We will need to change two things in there:

1. Now that we have voting, we need to add the `voteScore` of each post by doing an extra `JOIN` to the `votes` table, grouping by `postId`, and doing a `SUM` on the `voteDirection` column.
2. To make the output more interesting, we need to `ORDER` the posts by the highest `voteScore` first instead of creation time.

## Filling the database with "real data"
At this point you should have a database with `users`, `posts`, `subreddits`, and `votes` tables. You also have a set of JavaScript functions written for NodeJS that can communicate with your database server and query it to insert new data as well as retrieve existing data.

However, your database is empty. In this section, we will take advantage of reddit.com's JSON API to fetch some real Reddit data and populate our database. This will make us practice asynchronous programming as well as communication with web APIs.

First, go to your browser and open two tabs. In one tab, navigate to `https://www.reddit.com/`. In the other tab navigate to `https://www.reddit.com/.json`. What you see in the `.json` tab is the data equivalent of the regular Reddit home page. In there you have an array of post objects. Each object contains data about a certain post on Reddit like the user who posted, the subreddit, the time of creation, etc.

Reddit has such a data-oriented version for pretty much each page of its website. For example if you load `https://www.reddit.com/r/montreal.json`, you will see the data for the /r/Montreal homepage.

For this part of the project, we're going to write a small crawler for the Reddit.com JSON API. Our crawler will "discover" a list of the 25 most popular subreddits. For each subreddit, we will make a request to get the posts on its front page. This will give us a database with ~2000 posts in 50 subreddits. The posts should mostly be by different users. We will be skipping self posts since they don't fit with our model.

### Step 1: Read the code in `reddit-crawl.js`
To fill our database with some real Reddit data, we will be writing and running a script called `reddit-crawl.js`. A starter file has been provided for you. It contains one function `getSubreddits` that makes a request to the Reddit JSON API and retrieves a list of subreddits. Since the data returned from the Reddit API is quite thick, the function does a `map` on the parsed data to return only a list of subreddit name strings.

### Step 2: Complete the function `getPostsForSubreddit`
This function should return a list of the top 50 posts for the `subredditName` passed to it as an argument. If the `subredditName` is `montreal`, then you should make a request to `https://www.reddit.com/r/montreal.json?limit=50`.

When receiving the data, you will get an array of 50 posts under `data.children`. Just like for `getSubreddits`, start by parsing the result as JSON.

Then, similarly to `getSubreddits`, we will also be calling array methods to do some transformations on the data:

1. Using the `filter` method, get rid of all posts for which the `is_self` property is `true`.
2. Using the `map` method on the result, return objects with only these properties:
  * `title`: take it from the `title` property of the data
  * `url`: take it from the `url` property of the data
  * `user`: take it from the `author` property of the data

### Step 3: Do the crawling!
Armed with these two functions and the functions from `reddit.js`, we should be able to do what we need.

Notice that the `crawl` function has been provided to you! It uses the two funtions you just completed. All you have to do is execute `crawl`. Then, check your database to see if all the data got imported. This will test some of your `RedditAPI` functions at the same time.

---

## CHALLENGE: Adding a post comments functionality and filling it with "real data"
This feature will be complicated to implement because it will require not only adding new code, but also modifying existing code and databases. For this reason the steps are outlined in detail. By the end, we should have a function that allows us to add a comment to a post, both as a top-level comment or as a reply to another comment. We will also have a function that lists all the comments for a post, nested by reply level.

#### Step 1:
The first step will be to create a `comments` table. Each comment should have a unique, auto incrementing `id` and a `text` anywhere from 1 to 10000 characters. It should also have `createdAt` and `updatedAt` `DATETIME` columns. Each comment should also have a `userId` linking it to the user who created the comment (using a foreign key), a `postId` linking it to the post which is being commented on, and a `parentId` linking it to the comment it is replying to. A top-level comment should have `parentId` set to `NULL`.

Since this `CREATE TABLE` is a bit complicated, we are providing a solution for you. Try to find the correct solution before looking at this one.

```sql
CREATE TABLE comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT,
  postId INT,
  parentId INT,
  text VARCHAR(10000),
  FOREIGN KEY (userId) REFERENCES users (id) ON DELETE SET NULL,
  FOREIGN KEY (userId) REFERENCES posts (id) ON DELETE SET NULL,
  FOREIGN KEY (parentId) REFERENCES comments (id)
);
```

#### Step 2:
In the `reddit.js` API, add a `createComment(comment)` function. It should take a comment object which contains a `text`, `userId`, `postId` and optional `parentId`. It should insert the new comment, and either return an error or the ID of the new comment. If `parentId` is not defined, it should be set to `NULL`. You can take some inspiration from the `createPost` function which operates in a similar way.

#### Step 4:
In the `reddit.js` API, add a `getCommentsForPost(postId, levels)` function. It should return a **thread**
of comments in an array. The array should contain the top-level comments, and each comment can optionally have
a `replies` array. This array will contain the comments that are replies to the current one.

We can do this by using a recursive function. The steps will be like this:

1. Retrieve the top-level comments for a given post ID. These are the ones where parent_id is NULL.
2. Gather up all the unique IDs of the top-level comments, and retrieve those comments where the parentId is equal to one of those IDs
3. Keep going until either you have no more comments at a certain level, or you have reached `level` levels of replies.

The implementation is left up to you. In the end you will be doing one query per level of replies instead of one alltogether, but they will all be done by the same recursive function.

The final output should look something like this:

```json
[
    {
        "id": 456,
        "text": "the illuminati have their eye set on us",
        "createdAt": "...",
        "updatedAt": "...",
        "replies": [
            {
                "id": 499,
                "text": "what are you talking about????",
                "createdAt": "...",
                "updatedAt": "..."
            },
            {
                "id": 526,
                "text": "i agree with you",
                "createdAt": "...",
                "updatedAt": "...",
                "replies": [
                    {
                        "id": 599,
                        "text": "where is your tinfoil hat dude?",
                        "createdAt": "...",
                        "updatedAt": "..."
                    }
                ]
            }
        ]
    },
    {
        "id": 458,
        "text": "Douglas Adams must be rolling over in his grave!",
        "createdAt": "...",
        "updatedAt": "...",
        "replies": [
            {
                "id": 486,
                "text": "You mean George Orwell?",
                "createdAt": "...",
                "updatedAt": "..."
            }
        ]
    }
]
```

#### Step 5:
Taking inspiration from the crawler in `reddit-crawl.js`, fill up your database with random post comments coming from Reddit's own JSON API.