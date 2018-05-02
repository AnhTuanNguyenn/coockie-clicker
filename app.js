var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;
var url = 'mongodb://localhost:27017';
//var url = 'mongodb://<root>:<root>@ds111410.mlab.com:11410/node_db';
var express = require('express'),
app = express(),
server = require('http').createServer(app),
io = require('socket.io').listen(server);
app.use(express.static(__dirname + '/public'));

var db = null;

var $list_user = null;
var $list_top = {};
var $load_top_score = null;
var $load_top_user = null;
function get_list_user()

{
  db.collection('user').find({'score': {$gt:0}}).sort({'score':-1}).toArray
  (
      function (err, $arr_list_user) {
          if (err) 
          {
              console.log(err);
          } else 
          {
            $list_user = $arr_list_user;
            get_top_score(10);
            console.log("load top");
            return $list_user;
          } 
      }

  );
}

function get_top_score($top)
{
  $list_top = {};
  $top = parseInt($top);
  $count = 0;
  $load_top_score = "<tr><th>#</th><th>Member</th><th>Score</th></tr>";
  $list_user.forEach(function($row_user) {
    if($list_top[$row_user['username']]==null)
    {
      if($top == 0 || $count <= $top )
      {
        $list_top[$row_user['username']] = $row_user['score'];
        ++$count;
        $load_top_score += "<tr><td>"+$count+"</td><td>"+$row_user['username']+"</td><td>"+$row_user['score']+"</td></tr>";
      }
    }
  });
}


function get_top_user($username)
{
  $list_top = {};
  $count = 0;
  $load_top_user = "<tr><th>#</th><th>Career</th></tr>";

  $list_user.forEach(function($row_user) {

    if($row_user['username']==$username && ++$count <=10)
    {
      $load_top_user += "<tr><td>"+$count+"</td><td>"+$row_user['score']+"</td></tr>";
    }
  });
}


function add_user($id,$username)
{
  db.collection('user').insert({id: $id, username: $username,score: 0});
}

function update_user($id,$count)
{
  db.collection('user').update({id: $id},{$set:{'score':$count}});
  //cap nhat lai thong tin
  get_list_user();
}

MongoClient.connect(url,(err, client) => {
  // Client returned
  if (err) 
  {
    console.log('Unable to connect to the mongoDB server. Error:', err);
  } 
  else 
  {

      console.log('Connection established to', url);
      db = client.db('node_db');
      get_list_user();
  }
});

server.listen(3000, function () {
    console.log("Server Listening Port",3000);
});

app.get('/', function(req, res){
  console.log(1);
  res.sendfile(__dirname + '/index.html');
});

var players = {};
var maxClicks = 1000;

io.sockets.on('connection', function (socket) {


  socket.on('joinGame', function(name){

    console.log('player joins', players, name);
    socket.playername = name;

    add_user(socket.id,name);
    if(players[name]){
      console.log('Player exists', name);
      return socket.send('Name bereits vergeben: ' + name);
    }

    players[name] = {name: name, clicks: 0, prog: 0};
    console.log('CurrentPlayers', players);
    socket.emit('enteredGame', {name: name, players: players, prog: 0});
    get_top_user(name);
    setTimeout(function(){
      socket.emit('load_top_score',$load_top_score);
      socket.emit('load_top_user',$load_top_user);
    },2000);
    
    socket.broadcast.emit('playerJoined', {players: players});
  });

  socket.on('playerClicked', function(player){

    if(!players[player]){ return ;}
    players[player].clicks++;
    players[player].prog = (players[player].clicks / maxClicks) * 1000;
    console.log(maxClicks, players[player]);
    console.log('playerClicked', player);

    if(players[player].prog >= 1000){
      console.log('player wins', players[player].name);
      io.sockets.emit('gameFinished', players[player]);
    }

    socket.broadcast.emit('updateClicks', players[player]);
  });

  socket.on('disconnect', function(){

    if(players[socket.playername]){
      console.log("log out "+socket.id+" -- "+players[socket.playername].clicks);
      update_user(socket.id,players[socket.playername].clicks);
    }
    delete players[socket.playername];
    io.sockets.emit('playerleft', socket.playername);
  });

});
