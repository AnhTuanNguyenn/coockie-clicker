var Clicker;
var socket = io.connect('http://localhost:3000');

Clicker = (function(){

  function Clicker(){
    this.createListeners();
    this.clicks = 0;
    this.delay = 0;
    this.prog = 0;
    this.joinGame = __bind(this.joinGame, this);
    this.onPlayerJoined = __bind(this.onPlayerJoined, this);
    this.renderPlayerList = __bind(this.renderPlayerList, this);
  }

  Clicker.prototype = {
    createListeners: function(){
      socket.on('playerJoined', this.onPlayerJoined);
      socket.on('message', this.onMessage);
      socket.on('updateClicks', this.onUpdateClicks);
      socket.on('enteredGame', this.onEnteredGame);
      socket.on('gameFinished', this.onGameFinished);
      socket.on('load_top_score', function($data){
        $("#top_rank").show().html($data);
      });
      socket.on('load_top_user', function($data){
        $("#top_user").show().html($data);
      });

      $('#clicker-button').on('click', this.onClick);
    },

    onClick: function(evt){
      clicker.clicks++;
      clicker.prog = (clicker.clicks / 1000) * 100;
      clicker.onUpdateClicks({name: clicker.name, clicks: clicker.clicks, prog: clicker.prog});
      socket.emit('playerClicked', clicker.name);
    },

    joinGame: function(name){
      if(clicker.name === undefined){
        socket.emit('joinGame', name);
      }
    },

    onMessage: function(data){
      alert(data);
    },

    onEnteredGame: function(data){
      clicker.name = data.name;
      $('#join-wrapper').fadeOut(100, function(){
        clicker.renderPlayerList(data.players);
        $('#clicker-button').fadeIn();
      });
    },

    onPlayerJoined: function(data){
      clicker.renderPlayerList(data.players);
    },

    renderPlayerList: function(players){
      var list = '<table class="table table-striped"><thead><tr><th width="15%">Player</th><th>Progress</th></tr></thead>';
      var i = 0;
      var max = players.length;
      var prog = 0;
      var clickCount = 1000;
      $.each(players, function(key, player){
        prog = 0;
        list += '<tr>';
        list += '<td>' + player.name + '</td>';
        list += '<td><div class="progress"><div id="player-progress-' + player.name + '" class="bar" style="width: ' + prog + '%;"></div></div></td>';
        list += '</tr>';
      });

      list += '</table>';

      $('#game-wrapper').html(list).fadeIn();
    },

    onUpdateClicks: function(data){
      console.log('onUpdateClicks', data);
      $('#player-progress-' + data.name).css('width', data.prog + '%');
      if( clicker.delay==0 )
      {
        clicker.delay = 1;
        $("#clicker-button").addClass("animate");
        $("#user_b").show();
        $("#score").show();
      }
      $("#score").html(clicker.clicks);

    },

    onGameFinished: function(data){
      $('#clicker-button').unbind();
      alert(data.name + '!' + 'You have done all the clicks we needed! :)' );
    }
  };

  return Clicker;
})();
