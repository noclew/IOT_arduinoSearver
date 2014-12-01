//..................initialize required modules
var jq = require('jquery');
var express = require('express');
var app=express();
var http=require('http');
var oe = ">------------------------------------------------------<"
app.use(express.static(__dirname + '/public'));


var server = app.listen(process.env.PORT || 6789, function() {
  console.log('Listening on port %d', server.address().port);
});

//................................Socket.io
//initialize socket.io to listen to the same server as express
var io = require('socket.io').listen(server);


var users={};
var arduinos={};
var id=1;
var arduinoId = 1;

io.sockets.on('connection', function (socket) {
  console.log("CONNECTION");

  socket.user={'id':"user"+id, 'socket':socket, 'pos':{x:50, y:50}};
  id++;

  users[socket.user.id]=socket.user;
  
  var allusers=[];

  for(var i in users) {
    allusers.push({id:users[i].id, pos:users[i].pos});
  }

  socket.emit('welcome', {'id':socket.user.id, 'users':allusers, 'arduinos':arduinos, 'pos':socket.user.pos});

  console.log("user connected:"+socket.user.id);
  //socket.broadcast.emit('userJoined', {'id':socket.user.id, 'pos':socket.user.pos});


  socket.on('disconnect', function(){
    if (!socket.user) return;
    io.sockets.emit('userLeft', {'id':socket.user.id});
    delete users[socket.user.id];
  });

  //......................................................
  socket.on('moved', function(data){
    socket.user.pos=data.pos; //remember the last position of each user
    io.sockets.emit('moved', data);
  });

  socket.on('clicked', function(data){
    io.sockets.emit('clicked', data);
  });

  socket.on('setStyleProperty', function(data){
    io.sockets.emit('setStyleProperty', data);
  });

  socket.on('setText', function(data){
    io.sockets.emit('setText', data);
  });

  socket.on('addNote', function(data){
    io.sockets.emit('addNote', data);
  });

  socket.on('removeNote', function(data){
    io.sockets.emit('removeNote', data);
  });

  //////////

  socket.on('removeArduino', function(data){

    var arduinoId_removing = data[ "arduinoId" ]
    delete arduinos[arduinoId_removing];

    //print totla number of arduinos
    console.log(arduinoId_removing + " has been removed, now "+ Object.keys(arduinos).length + " arduinos ");
    console.log( oe );
    io.sockets.emit('removeArduino', data);

  });

  socket.on('addArduino', function(data){
    data._id = "arduino" + arduinoId;
    arduinoId++;
    arduinos[ data._id ] = data;
    io.sockets.emit('addArduino', data);

    //print totla number of arduinos
    console.log("An arduino is added, now "+ Object.keys(arduinos).length + " arduinos ");
    console.log( oe );
    
  });

  socket.on('toggleDigital', function(data){
    curArduino = data["arduinoId"];
    slotNo = data["no"];
    console.log(curArduino+"- digital slot :" + slotNo + " ::");
    console.log(arduinos[curArduino].digitalStatus[slotNo] + " to " + !arduinos[curArduino].digitalStatus[slotNo])
    arduinos[curArduino].digitalStatus[slotNo] = !arduinos[curArduino].digitalStatus[slotNo]
    console.log("---EOO---");


    // console.log(tmp);
    // arduinos[data.arduinoId].digitalPins[data.no] = !tmp;
    // console.log(arduinos[data.arduinoId].digitalPins[data.no]);
    socket.broadcast.emit("toggleDigital", data);
    ajaxDigitalCall(data);
  });


function ajaxDigitalCall(data){
  console.log(data);
  arduino = arduinos[data["arduinoId"]];
  ip = arduino.ip;
  strMid = "/arduino/digital/"
  no = data['no']
  value = arduino.digitalStatus[no] ? "/1" : "/0";
  arduinoUrl = ip+strMid+no+value;
  console.log(arduinoUrl);

  var request = http.get(arduinoUrl, function (response) {} );
  // $.ajax({
  //   url: arduinoUrl,
  //   // the name of the callback parameter, as specified by the YQL service
  //   jsonp: "callback",

  //     // tell jQuery we're expecting JSONP
  //     dataType: "jsonp",

  //     // tell YQL what we want and that we want JSON
  //     data: {},
  //     // work with the response
  //     success: function( response ) {
  //         console.log( response ); // server response
  //     }});
}

  
});