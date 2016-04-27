// load the mysql library
var mysql = require('mysql');

// create a connection to our Cloud9 server
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'ziad_saab',
  password : ''
});

// load our API and pass it the connection
var reddit = require('reddit')(connection);
