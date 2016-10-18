// load the mysql library
var mysql = require('mysql');

// create a connection to our Cloud9 server
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'ziad_saab', // CHANGE THIS :)
  password : '',
  database: 'reddit'
});

// load our API and pass it the connection
var reddit = require('./reddit');
var redditAPI = reddit(connection);

// It's request time!
redditAPI.createUser({
  username: 'hello23',
  password: 'xxx'
}, function(err, user) {
  if (err) {
    console.log(err);
  }
  else {
    redditAPI.createPost({
      title: 'hi reddit!',
      url: 'https://www.reddit.com',
      userId: user.id
    }, function(err, post) {
      if (err) {
        console.log(err);
      }
      else {
        console.log(post);
      }
    });
  }
});
