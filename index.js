const express = require('express');
var app = express();
const bodyParser = require("body-parser");
//const jsonParser = express.json();
const urlencodedParser = bodyParser.urlencoded({extended: false});
var http = require('http').createServer(app);
//var io = require('socket.io')(http);
var port = 3000;
const MongoClient = require('mongodb').MongoClient;
const objectId = require('mongodb').ObjectID;

var nickname;

app.use(express.static('public'));

app.get('/', function(req, res){
  res.sendFile(__dirname + '/login.html');
});

app.get('/reg', function(req, res){
  res.sendFile(__dirname + '/register.html');
});

app.post('/chatReg', urlencodedParser, function(request, response) {
  if(!request.body) return console.log(err);
  console.log(request.body);
  var user = {
    login: request.body.log,
    pass: request.body.pass
  }
  const mongoClient = new MongoClient("mongodb://localhost:27017/", {useNewUrlParser: true});
  mongoClient.connect(function(err, client) {
    if (err) return console.log(err);
    const db = client.db("userdb");
    const collection = db.collection("users");
    collection.findOne(user, function(error, doc) {
      if (err) return console.log(error);
      console.log(doc);
      if (doc==null) {
        collection.insertOne({login: user.login, pass: user.pass}, function(err, result){
          if (err) return console.log(err);
            console.log(result.ops);
            client.close();
            nickname = user.login + " ";
            response.sendFile(__dirname + '/chat.html');
        });
      } else {
        response.end("Choose another login or password");
      }
    });
  });
});

app.post("/chat", urlencodedParser, function (request, response) {
  if(!request.body) return response.sendStatus(400);
  console.log(request.body);
  var user = {
    login: request.body.log,
    pass: request.body.pass
  };
  const mongoClient = new MongoClient("mongodb://localhost:27017/", {useNewUrlParser: true});
  mongoClient.connect(function(err, client) {
    if (err) return console.log(err);
    const db = client.db("userdb");
    const collection = db.collection("users");
    collection.findOne(user, function(error, doc) {
      if (err) return console.log(error);
      console.log(doc);
      if (doc==null) {
        client.close();
        response.end("Invalid data, double-check your login and password");
      } else {
        nickname = doc.login + " ";
        response.sendFile(__dirname + '/chat.html');
        client.close();
      }
    });
  });
});

app.get('/about', function(req, res) {
  res.sendFile(__dirname + '/index1.html');
});

app.get('/table', function(req, res) {
  res.sendFile(__dirname + '/table.html');
});

app.get('/tableCreate', function(req, res) {
  res.sendFile(__dirname + 'tableCreate.html');
});

app.get('/users', function(req, res) {
  const mongoClient = new MongoClient("mongodb://localhost:27017/", {useNewUrlParser: true});
  mongoClient.connect(function(err, client) {
    if (err) return console.log(err);
    const db = client.db("userdb");
    const collection = db.collection("users"); 
    collection.find().toArray(function(err, users){
      if (err) return console.log(err);
      res.send(users);
      client.close();
    });
  });
});

/*io.on('connection', function(socket) {
  socket.username = nickname;
    socket.on('chat message', function(msg) {
        io.emit('chat message', msg, socket.username);
    });
});*/
http.listen(port, function(){
  console.log('listening on *:' + port);
});
