var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io').listen(http);

app.get('/', function(req, res) {
  res.sendfile('client/index.html');
});
console.log(io);
var userArr = []; //populates with usernames as people enter them
var clientIndex;
var videoId; //this is up here so that it's a server variable that all clients can access, not delegated to just one socket.
var videoCurrentTime;
io.on('connection', function(client) {
    client.emit('getId', client.id);
    client.on('disconnect', function(){
        function findUserIndex(element, index, array) {
          return client.id === element.id; //if the id of client that is disconnecting = the elem in array, remove it!
        }
        clientIndex = userArr.findIndex(findUserIndex); //finds index of the person that is disconnecting
        if(clientIndex >=0) { //when no username is inputted, nothing is added to array, which means clientIndex = -1. adding check makes sure there is a username.
          var clientUsername = userArr[clientIndex].username;
          io.sockets.emit('message', {username: "SERVER", text: clientUsername + " has disconnected!"}); console.log(clientUsername+" disconnected");
          io.sockets.emit('removeUser', userArr[clientIndex].username); //before removing from array, use the clientIndex var to removeuser          
          userArr.splice(clientIndex, 1); //removes name from array, starting at the index of client at removing 1 element from that position 
        }
    });
    
    client.on('message', function(msgData){ //upon 'message', send client msgdata
      io.sockets.emit('message', msgData); //io.sockets is how you get ALL clients
    });
    
    client.on('setUsername', function(username){ //sends username to client once again
      client.emit('setUsername', username);
    });
    
    client.on('addUser', function(username){ /*HAVE IT SEND USERS ON CONNECTION, NOT WHEN THE USER ENTERS A USERNAME!!! rewrite this asap.*/
      io.sockets.emit('addUser', username);//broadcast addUser, adding newest user to every client, must use io instad of sockets for some reason
      userArr.push({username: username, id: client.id}); //pushes the client.id(unique) and the client's username to userArr as object
      for(var i=0; i<userArr.length-1; i++){ //loops through all previous names and adds them to userList
        client.emit('addUser', userArr[i].username);
      }
    });
    /*VIDEO PLAYER STUFF*/
    client.on('videoId', function(id){ //videoId client sends to server
      videoId = id;
      io.sockets.emit('playVideo', {id: videoId, time: 0});
    });
    //when someone connects...
    client.broadcast.emit('getCurrentTime', 1); //broadcasts to everyone but the client who connected
    client.on('currentTime', function(currentTime){
      videoCurrentTime = currentTime;
    });
    client.on('playerReady', function(foo){
      client.emit('playVideo', {id: videoId, time: videoCurrentTime});
    });
    //when video ends...
    //think about a possible 'playlist' function, where people add videoId s to a playlist and when the video ends, you can play one
    //after another. The playlist could be an array where you emit playVideo with id: array[0], set that id to the videoId variable, 
    //and just array.shift the one you just played off!

});


http.listen(process.env.PORT, process.env.IP, function() {

});