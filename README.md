# Reddit NodeJS API

In this project, we're going to build a tiny Reddit API. But wait, don't we need to learn about
web servers, HTTP, REST and all these buzzwords before building an API?? Not really!

We won't be building a *Web* API yet, only a set of NodeJS callback-receiving functions that will
do the dirty work of taking our data and putting it in our database.

The project has already been initialized with a few files to get you started:

* `reddit.sql`: This file contains `CREATE TABLE` statements for users and posts
* `reddit.js`: This file contains the actual Reddit API. The only things that should
be in there are functions that talk to our database
* `index.js`: This is the starting point of our application.

In the next section, we will review in detail the contents of `reddit.js` and `index.js`.

## Initial files

### `reddit.sql`
This file contains two `CREATE TABLE` statements, which we are already used to. You may notice there is
something weird going on with the `createdAt` and `updatedAt` fields: basically we want these fields
to be automatically set by MySQL, but MySQL only allows **one** `CURRENT_TIMESTAMP` field. So what we do
is set the `createdAt` to `DEFAULT 0`, but later on in `reddit.js` we set it to `NULL`. Since `NULL` is
not an acceptable value here, MySQL will make it default to the current timestamp, which is what we wanted.

### `index.js`
This is the "main" file of our application, meaning it's the one we will run to get things done.
First, we load the `mysql` NodeJS library. This library will let us communicate with MySQL similarly
to what we have been doing with the command-line: writing queries and getting responses.

Next, we create a connection to a MySQL server. On Cloud9, our database does not need to be 100% secure,
so we are setup with a MySQL server that we can login to with our Cloud9 username and no password. The
connection is using the `reddit` database, which we haven't created yet.

After that, we load the `./reddit` module, which exports a single function: the reason for this is
that all the functions of our API require a database connection. Instead of establishing the database
connection inside the `reddit.js` file, we choose to keep it pure: we pass the connection to the
function, and it returns to us the actual API. This is a common pattern in development. This is a good
time to make sure you understand what is going on, and ask questions if not.

Finally, after having initialized the API, we can start doing ad-hoc requests to it. In the current
example, we are creating a new user, then using its `id` to create a new post.

### `reddit.js`
This is the core file of the project. Even though it only exports one function, this function is only
there for the purpose of accepting a database connection object. Once it receives a connection, it
returns the actual API of our Reddit clone.

#### `createUser`
The first function we see being exported is `createUser`. It takes an object of user properties, and a callback.
This is required, because the mysql library we are using is also callback-based. Since we are getting
our result in a callback, we also have to accept a callback to pass the final result to.

The first thing our `createUser` function does is "hash" the user's password using the `bcrypt` library. This step
is necessary to protect our users' information. **It is computationaly infeasible to recover the actual password
from the hash**. The way this works is that when the user logs in, we hash the provided password using the
same function. If both hashes match, then it's a success. Otherwise we can safely say it's the wrong password.

Once the hash is completed, we get back the hashed password in our callback. We use the hashed password
to do an `INSERT` in our database. Here we are using the `createdAt` "hack": basically we are setting
the column to `NULL`, and MySQL will set it to the current timestamp. The `updatedAt` column is fully
managed by MySQL: it will set it when we create the user, and update it whenever we make a change to that user.

Another thing you will notice is the `?`s in the SQL query. These placeholders are **super important**. First off,
they make it so that we don't have to concatenate strings together to infinity. But more importantly,
they will make sure to **properly escape** any string we give to them. To make this work, we pass the
`conn.query` function an array of the strings that should replace the `?`s, and it puts the query together for us.

#### `createPost`
This works similarly to the `createUser` function, except we don't need the password hashing step.

#### `getAllPosts`
This function is different from the previous two in that it doesn't add any data to our system. It uses
a regular `SELECT` to retrieve all the posts. The function requires an `options` object, which for the moment
can contain a `numPerPage` and a `page`. These will be translated to a `LIMIT` and `OFFSET` to allow
for pagination of our posts.

## Your work
Your work will consist in incrementally adding features to the API to make it more complete. Most of the
features are independent, so they can be worked on separately. If you want to work on more than one
feature at a time, it would be a good idea to create a branch for each feature until you are ready
to merge it to master ;)

### Improve the `getAllPosts` function
At the moment, the `getAllPosts` function is returning an array of posts. The problem is that it's
hard to figure out the username associated to each post. Since our database schema is somewhat
**normalized**, the posts table only contains a **reference** to the users table, through the `userId`
column. Your job is to improve this function by returning the user associated with each post.

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
        "userId": 1,
        "user": {
            "id": 12,
            "username": "n00bster",
            "createdAt": "...",
            "updatedAt": "..."
        }
    }
]
```

You can achieve this by completing the current query and adding a `JOIN` to it.

### Add a `getAllPostsForUser(userId, options, callback)` function
The function `getAllPosts` returns all the posts for all the users in the system (with a limit). Here,
we want to return only the posts for one userId. It will be quite similar to the `getAllPosts` function,
except that it will take an additional `userId` parameter. Your function should also use the `numPerPage` and `page` options to provide a paginated result set.


### Add a `getSinglePost(postId, callback)` function
Currently there is no way to retrieve a single post by its ID. This would be important for eventually
displaying this data on a webpage. Create this function, and make it return a **single post**, without array.


### Add subreddits functionality
This feature will be more complicated to implement, because it will require not only adding new functions,
but also modifying existing ones.

#### Step 1:
The first step will be to create a `subreddits` table. Each subreddit should have a unique, auto incrementing
`id`, a `name` anywhere from 1 to 30 characters, and an optional description of up to 200 characters. Each sub
should also have `createdAt` and `updatedAt` timestamps that you can copy from an existing table. To guarantee
the integrity of our data, we should make sure that the `name` column is **unique**.

Once you figure out the correct `CREATE TABLE` statement, add it to `reddit.sql` with a comment.

#### Step 2:
Then we need to add a `subredditId` column to the posts table, with associated foreign key. Once you figure
out the correct `ALTER TABLE` statement, make sure to add it to `reddit.sql` with a comment.

#### Step 3:
In the `reddit.js` API, add a `createSubreddit(sub, callback)` function. It should take a subreddit object which
contains a `name` and optional `description` property. It should insert the new subreddit, and either
return an error or the newly created subreddit. You can take some inspiration from the `createPost` function
which operates in a similar way :)

#### Step 4:
In the `reddit.js` API, add a `getAllSubreddits(callback)` function. It should return the list of all
subreddits, ordered by the newly created one first.

#### Step 5:
In the `reddit.js` API, modify the `createPost` function to take a `subredditId` parameter and use it.

#### Step 6
In the `reddit.js` API, modify the `getAllPosts` function to return the **full subreddit** associated with each post.
You will have to do an extra `JOIN` to accomplish this.


### Add comments functionality
This feature will be complicated to implement because it will require not only adding new code, but also
modifying existing code and databases. For this reason the steps are outlined in detail.

#### Step 1:
The first step will be to create a `comments` table. Each comment should have a unique, auto incrementing
`id` and a `text` anywhere from 1 to 10000 characters. It should also have `createdAt` and `updatedAt`
timestamps that you can copy from an existing table. Each comment should also have a `userId` linking
it to the user who created the comment (using a foreign key), a `postId` linking it to the post which is
being commented on, and a `parentId` linking it to the comment it is replying to. A top-level comment should
have `parentId` set to `NULL`.

Once you figure out the correct `CREATE TABLE` statement, add it to `reddit.sql` with a comment.

#### Step 2:
In the `reddit.js` API, add a `createComment(comment, callback)` function. It should take a comment object which
contains a `text`, `userId`, `postId` and optional `parentId`. It should insert the new comment, and either
return an error or the newly created comment. If `parentId` is not defined, it should be set to `NULL`. You can
take some inspiration from the `createPost` function which operates in a similar way :)

#### Step 4:
In the `reddit.js` API, add a `getCommentsForPost(postId, callback)` function. It should return a **thread**
of comments in an array. The array should contain the top-level comments, and each comment can optionally have
a `replies` array. This array will contain the comments that are replies to the current one. Since you will be
using one `LEFT JOIN` per level of comment, we will limit this exercise to retrieving 3 levels of comments.
The comments should be sorted by their `createdAt` date at each level.

**NOTE**: The way this exercise is done, the comments will be returned without the associated usernames. We will
be getting only the `userId` instead. The next exercise asks you to add the username to the data.

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

#### Step 6
In the `reddit.js` API, modify the `getSinglePost` function to return the full thread of comments in
addition to the post data itself. This will require re-using your `JOIN` logic from `getCommentsForPost`.


### Add usernames to the comments functionality
Return to the comments functionality and add the username for each comment. Since we are only requiring the
username and not the full user object, you don't need to nest a user object with each comment. A `username`
property will be sufficient. For example:

```json
{
    "id": 486,
    "text": "You mean George Orwell?",
    "createdAt": "...",
    "updatedAt": "...",
    "username": "PM_ME_YOUR_BOOKIES"
}
```