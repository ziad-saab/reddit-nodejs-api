var bcrypt = require('bcrypt-as-promised');
var HASH_ROUNDS = 10;

class RedditAPI {
    constructor(conn) {
        this.conn = conn;
    }

    createUser(user) {
        /*
        first we have to hash the password. we will learn about hashing next week.
        the goal of hashing is to store a digested version of the password from which
        it is infeasible to recover the original password, but which can still be used
        to assess with great confidence whether a provided password is the correct one or not
         */
        return bcrypt.hash(user.password, HASH_ROUNDS)
            .then(hashedPassword => {
                return this.conn.query('INSERT INTO users (username,password, createdAt, updatedAt) VALUES (?, ?, NOW(), NOW())', [user.username, hashedPassword]);
            })
            .then(result => {
                return result.insertId;
            })
            .catch(error => {
                // Special error handling for duplicate entry
                if (error.code === 'ER_DUP_ENTRY') {
                    throw new Error('A user with this username already exists');
                }
                else {
                    throw error;
                }
            });
    }
    
    createSubreddit(subreddit){
        return this.conn.query(`
            INSERT INTO subreddits (name, description, createdAt, updatedAt)
            VALUES (?, ?, NOW(), NOW())`, [subreddit.name, subreddit.description]
        )
        .then(result => {
            return result.insertId;
        })
        .catch(error => {
            if (error.code === 'ER_DUP_ENTRY'){
                throw new Error('A subreddit with this name already exists');
            }
            else{
                throw error;
            }
        });
    }
    
    createPost(post) {
        return this.conn.query(
            `
            INSERT INTO posts (userId, title, url, createdAt, updatedAt, subredditId)
            VALUES (?, ?, ?, NOW(), NOW(), ?)`,
            [post.userId, post.title, post.url, post.subredditId]
        )
            .then(result => {
                return result.insertId;
            })
            .catch(error => {
                if (!post.subredditId){
                    throw new Error('Could not find subreddit Id');
                }
                else{
                    throw error;
                }
            });
    }

    getAllPosts() {
        /*
        strings delimited with ` are an ES2015 feature called "template strings".
        they are more powerful than what we are using them for here. one feature of
        template strings is that you can write them on multiple lines. if you try to
        skip a line in a single- or double-quoted string, you would get a syntax error.

        therefore template strings make it very easy to write SQL queries that span multiple
        lines without having to manually split the string line by line.
         */
        return this.conn.query(
            `
            SELECT posts.id AS thePostId,
            title,
            url,
            userId,
            posts.createdAt AS postCreate , 
            posts.updatedAt AS postUpdate,
            username,
            users.createdAt AS userCreate,
            users.updatedAt AS userUpdate,
            subreddits.id AS theSubredditId,
            name,
            description,
            subreddits.createdAt AS subredditCreate,
            subreddits.updatedAt AS subredditUpdate
            FROM posts JOIN users
            ON users.id = posts.userId
            JOIN subreddits
            ON subreddits.id = posts.subredditId
            ORDER BY posts.createdAt DESC
            LIMIT 25`
            
        )
            .then (response => {
                var mapped = response.map(function(value, index){
                var newArr = {
                        id: value.thePostId,
                        title: value.title,
                        url: value.url,
                        user: {
                            id: value.userId,
                            username: value.username,  
                            createdAt: value.userCreate,
                            updatedAt: value.userUpdate
                        },
                        subreddit:{
                            id: value.theSubredditId,
                            name: value.name,
                            description: value.description,
                            createdAt: value.subredditCreate,
                            updatedAt: value.subredditUpdate
                            
                        },
                        createdAt: value.postCreate,
                        updatedAt: value.postUpdate
                        
               };
               return newArr;
                });
                
                console.log(mapped);
            }
                
                );
    }
    getAllSubreddits(){
        return this.conn.query(
            `
            SELECT id, name, description, createdAt, updatedAt
            FROM subreddits
            ORDER BY createdAt DESC
            `
            );
    }
    
}

module.exports = RedditAPI;