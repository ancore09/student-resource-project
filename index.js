const express = require('express');
var app = express();
const bodyParser = require("body-parser");
//const jsonParser = express.json();
const urlencodedParser = bodyParser.urlencoded({extended: false});
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var port = 3000;
const MongoClient = require('mongodb').MongoClient;
const objectId = require('mongodb').ObjectID;

const mongoClient = new MongoClient("mongodb://localhost:27017/", {useNewUrlParser: true}, {poolSize: 0});

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
            response.sendFile(__dirname + '/indexChat.html');
        });
      } else {
        response.end("Choose another login or password");
      }
    });
  });
});

app.post("/chat", urlencodedParser, function (request, response) {
  const mongoClient = new MongoClient("mongodb://localhost:27017/", {useNewUrlParser: true});
  if(!request.body) return response.sendStatus(400);
  console.log(request.body);
  var user = {
    login: request.body.log,
    pass: request.body.pass
  };
  
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
        response.sendFile(__dirname + '/indexChat.html');
        client.close();
      }
    });
  });
});

app.post("/chat:logined", urlencodedParser, function (request, response) {
  response.sendFile(__dirname + '/indexChat.html');
});

app.get('/main', function(req, res) {
  res.sendFile(__dirname + '/indexMain.html');
});

app.get('/main/news', function(req, res) {
  const mongoClient = new MongoClient("mongodb://localhost:27017/", {useNewUrlParser: true});
  mongoClient.connect(function(err, client) {
    if (err) return console.log(err);
    const db = client.db("newsdb");
    const collection = db.collection("news");
    collection.find().toArray(function(err, news) {
      if (err) return console.log(err);
      //console.log(news);
      res.send(news);
      client.close();
    });
  });
});

app.get('/table', function(req, res) {
  res.sendFile(__dirname + '/table.html');
});

app.get('/tableCreate', function(req, res) {
  res.sendFile(__dirname + '/tableCreate.html');
});

app.post('/tableCreate/save', urlencodedParser, function(req, res) {
  console.log(req.body.thead);
  
  mongoClient.connect(function(err, client){
    if (err) return console.log(err);
    const db = client.db("tabledb");
    const collection = db.collection("table");
    collection.insertOne({thead: req.body.thead}, function(err, result) {
      if (err) return console.log(err);
      console.log(result.ops);
      client.close();
    });
  });
});

app.get('/getTable', function(req, res) {
  const mongoClient = new MongoClient("mongodb://localhost:27017/", {useNewUrlParser: true});
  mongoClient.connect(function(err, client) {
    if (err) return console.log(err);
    var db = client.db("tabledb");
    var collection = db.collection("table");
    var theadRes;
    collection.find().toArray(function(err, thead) {
      if (err) return console.log(err);
      theadRes = thead;
      //console.log(thead);
      //client.close();
    });

    db = client.db("userdb");
    collection = db.collection("users");
    collection.find().toArray(function(err, users){
      if (err) return console.log(err);
      var response = {
        users: users,
        thead: theadRes
      }
      res.send(response);
    });
    client.close();
  });
});


/*app.get('/users', function(req, res) {
  
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
});*/

io.on('connection', function(socket) {
  //const mongoClient = new MongoClient("mongodb://localhost:27017/", {useNewUrlParser: true}, {poolSize: 0});
    socket.on('chat message', function(msg, nickname) {
      io.emit('chat message', msg, nickname);
      saveMes(msg, nickname);  
    });

    socket.on('disconnect', function() { 
      console.log("disconnected");
      //mongoClient.close(true);
    });
});

app.get('/getMessages', function(req, res) {
  const mongoClient = new MongoClient("mongodb://localhost:27017/", {useNewUrlParser: true});
  mongoClient.connect(function(err, client) {
    if (err) return console.log(err);
    db = client.db('messages');
    collection = db.collection("messages");
    collection.find().toArray(function(err, messages) {
      if (err) return console.log(err);
      res.send(messages);
    });
  });
  
});

http.listen(port, function(){
  console.log('listening on localhost:' + port);
});

function closeConnect(con) {
  con.close(true);
  //setTimeout(function() { con.close(); }, 6000);
}

function saveMes(msg, nickname) {
  const mongoClient = new MongoClient("mongodb://localhost:27017/", {useNewUrlParser: true});
  mongoClient.connect(function(err, client) {
    if (err) return console.log(err);
    client.db("messages").collection("messages").insertOne({ nick: nickname, body: msg}, function(err, result) {
      if (err) {
        client.close();
        return console.log(err);
      }
      console.log(result.ops);
      client.close();
    });  
  });
}
