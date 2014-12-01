var socket=io();

var myid=0; //this variable will hold the unique id that the server will assign to us as soon as we connect
var notes=0; //this is just a counter so that we can assign a unique number each time we create a note. So the first note we create will have an id that is a combination of our user id+0 then the next myid+1 etc... Therefore we will be able to use a unique id for each note which will be the same for all users.

var myArduinoIds = [];
var userCount = 0;
var arduinoUsers = [];
//.......................................................user DOM element
//this function will create a div to represent a user with a given id. It will also assign the particular CSS style class to the newly created div and position it at x,y coordinates

function arduinoUser () {
	this._id = null;
	this._type = "arduino";
	this._name = null;
	this._color = null;
	this.ip = null;

	this.analogPins = [];
	this.digitalPins = [];

	this.getId = function() {
		return this.id;
	};
}


function submitArduino(){
	
	color = document.getElementById("arduinoColor").value;
	if (!color){
		color =  '#'+Math.floor( ( Math.random()*5592450) + 11184900).toString(16)  //16777215 = ffffff
	}
	userCount += 1;
	var tempArduino = new arduinoUser();

	tempArduino._id = "arduino" + userCount;
	tempArduino._color = color;
	tempArduino.ip = document.getElementById("ipAddress").value;

	tempArduino._name = document.getElementById("arduinoName").value + " @ " + tempArduino.ip;
	tempArduino.analogPins = document.getElementById("analogPins").value.split(",");
	tempArduino.digitalPins=  document.getElementById("digitalPins").value.split(",");
	tempArduino.userName = document.getElementById("arduinoName").value;

	//핀 해야됨 나중에..
	initiateArduinoPins(tempArduino);
	socket.emit('addArduino', tempArduino);

	arduinoUsers.push(tempArduino);


}


function initiateArduinoPins(arduino){
	arduino.digitalStatus = {};
	arduino.analogStatus = [];

	//digital
	for	(index = 0; index < arduino.digitalPins.length; index++) {
		arduino.digitalStatus[ arduino.digitalPins[index] ] = false;
	}

	//analogue
	for	(index = 0; index < arduino.analogPins.length; index++) {
		arduino.analogStatus[index] = false;
	}
}

function createDigitalbuttons(arduino){
	var buttons = [];

	for ( idx = 0; idx < arduino.digitalPins.length; idx++){
		//creating toggle box
		var buttonToggle = document.createElement("input");
		buttonToggle.type = "checkbox";
		buttonToggle.id = arduino._id + "/digital/" + arduino.digitalPins[idx];
		buttonToggle.name = buttonToggle.id;
		if (arduino.digitalStatus[arduino.digitalPins[idx]]){
			buttonToggle.checked = true;
		}
		buttons.push( buttonToggle );
	}

	return buttons;
}


function createArduinoPanel(arduino){
	var maindiv=document.getElementById("central"); //find the central div [the main viewport]
	var newdiv=document.createElement("div");  	//create a new div to represent the user id
	maindiv.appendChild(newdiv); 				//append the newly created div to the main viewport		
	newdiv.className="divArduinoController";				//assign the style class to the div
	newdiv.style.left = 100;
	newdiv.style.top = 100;

	//new Div ID
	newdiv.id = arduino._id;
	newdiv.style.backgroundColor = arduino._color;

	var br = document.createElement("br");
	var para = document.createElement("p");
	
	var txtNode = document.createTextNode(arduino._name);
	newdiv.appendChild(txtNode);
	newdiv.appendChild( br );

	var digitalButtons = createDigitalbuttons(arduino);

	for (idx = 0; idx < digitalButtons.length ; idx++){
		
		var label = document.createElement("label");
		label.htmlFor = digitalButtons[idx].id;
		label.id = "label/" + digitalButtons[idx].id; 
		label.appendChild( document.createTextNode( "Digital Pin " + arduino.digitalPins[idx] )) ;
		
		newdiv.appendChild(digitalButtons[idx]);
		newdiv.appendChild(label);

		//$("#"+digitalButtons[idx].id).click(function(event) { alert(event.target.id); });
		
		var jqId = digitalButtons[idx].id.split("/");
		$("#"+jqId[0]+"\\/"+jqId[1]+"\\/"+jqId[2]).click(function(event) { toggleCheckbox(event.target.id); });
		
		/////////////////////////////question////////////////
		// digitalButtons[idx].onchange = function(){
		// 	toggleCheckbox( id ) ;
		// };	
		/////////////////////////////question////////////////
		
	}

	var buttonRemove = document.createElement("button");
	var t = document.createTextNode("REMOVE THIS ARDUINO"); 
	
	btId = "rm_"+newdiv.id;	
	buttonRemove.appendChild(t);
	buttonRemove.id = btId;
	newdiv.appendChild(buttonRemove);
	
	$("#"+btId).click(function(event){ 
		var arduinoId = event.target.id.split("_")[1];
		socket.emit('removeArduino', {"arduinoId":arduinoId})
	});
}
function removeArduino(arduinoId){
	document.getElementById(arduinoId).remove();
	//socket.emit('removeArduino', {"arduinoId":arduinoId})
}

function toggleCheckbox(buttonId){
	console.log(buttonId);
	var txt = buttonId.split("/");
	socket.emit('toggleDigital', { 'arduinoId':txt[0], 'no':txt[2], 'objId':buttonId });

	////////////////////////////
}


function checkBoxClicked(cb){

};

function createUser(id, styleclass, x, y) {
	var maindiv=document.getElementById("central"); //find the central div [the main viewport]
	var newdiv=document.createElement("div");  	//create a new div to represent the user id
	maindiv.appendChild(newdiv); 				//append the newly created div to the main viewport		
	newdiv.className=styleclass;				//assign the style class to the div
	newdiv.style.left=x;						//set the x and y position
	newdiv.style.top=y;
	newdiv.id=id;								//set the unique id of the div to be the same as the user it represents

	var textnode=document.createTextNode('id:'+id);	//to add text inside a div we need to create and add a text node. Here we are creating a node that contians the text "id:userid"
	newdiv.appendChild(textnode);

	var bubble=document.createElement("div"); 	//we create the bubble div that will display the text that users write. this div will be added to the user div as a sub element. So when the user div moves the bubble will move along
	newdiv.appendChild(bubble); 			
	bubble.className="Bubble";			
	bubble.id=id+"_bubble";

	var bubbletextnode=document.createTextNode("some text");	//add some text inside the bubble
	bubble.appendChild(bubbletextnode);

	//we attach an event handler so that every time you click inside a user's div a message is sent out to notify everyone that you clicked a user
	newdiv.onmousedown=function(e) {
		e.stopPropagation();
		socket.emit('clicked', {'ClickerId':myid, 'Clicked':newdiv.id});
		//socket.emit('setStyleProperty', {'id':newdiv.id, 'property':'width', 'value':(10+Math.random()*50)+'px'});
	}
}

function removeUser(id) {
	var div=document.getElementById(id);
	if (!div) return;
	div.parentNode.removeChild(div);
}

function moveUser(id, x, y) {
	var div=document.getElementById(id);
	if (!div) return;
	div.style.left=x+'px';					
	div.style.top=y+'px';
}

socket.on('welcome', function(data){
	console.log(data);
	myid=data.id;

	//createUser(data.id, "User MyUser", data.pos.x+'px', data.pos.y+'px');
	$.each( data.arduinos, function(key, value){
		//console.log(value);
		createArduinoPanel(value);
	});


	for(var i in data.users) {
		if (data.users[i].id==myid) continue;
		//createUser(data.users[i].id, "User", data.users[i].pos.x+'px', data.users[i].pos.y+'px');
	}

	var colorText=document.getElementById("colorInput");
	var noteText=document.getElementById("noteInput");
	//socket.emit('setStyleProperty', {'id':myid, 'property':'backgroundColor', 'value':colorText.value});
	socket.emit('setText', {'id':myid, 'text':noteText.value});
});

socket.on('userJoined', function(data) {
	console.log('user joined '+data.id+":");
	console.log(data);

	createUser(data.id, "User", '50px', '50px');		
});

socket.on('userLeft', function(data) {
	console.log('user left '+data.id);
	removeUser(data.id);
});

socket.on('moved', function(data) {
	moveUser(data.id, data.pos.x, data.pos.y);
});

socket.on('clicked', function(data){
	console.log(data);
});

// socket.on('setStyleProperty', function(data){
// 	//console.log(data);
// 	var div=document.getElementById(data.id);
// 	if (!div) return;
// 	div.style[data.property]=data.value;					
// });

socket.on('setText', function(data){
	var div=document.getElementById(data.id+"_bubble");
	if (!div) return;
	div.firstChild.nodeValue=data.text;	
});

socket.on('addNote', function(data){
	var maindiv=document.getElementById("central");
	var newdiv=document.createElement("div"); 
	maindiv.appendChild(newdiv); 			
	newdiv.className="Note";			
	newdiv.style.left=data.pos.x+'px';					
	newdiv.style.top=data.pos.y+'px';
	newdiv.id=data.noteId;

	for(var sp in data.style) {
		newdiv.style[sp]=data.style[sp];
	}

	var textnode=document.createTextNode(data.text);
	newdiv.appendChild(textnode);

	newdiv.onmousedown=function(e) {
		e.stopPropagation();
		socket.emit('removeNote', {'noteId': newdiv.id});
	}
});

socket.on('removeNote', function(data){
	var div=document.getElementById(data.noteId);
	if (!div) return;
	div.parentNode.removeChild(div);
});

function getMouseLocation(_event, _element) {
	var rect = _element.getBoundingClientRect();
	return {x:_event.clientX - rect.left, y:_event.clientY - rect.top};
}

var mousemovefire=null;
setInterval(function() {
	if (mousemovefire) {
		socket.emit('moved', mousemovefire);
		mousemovefire=null;
	}
}, 100);

$(document).ready(
	function() {
		var maindiv=document.getElementById("central");
		var noteText=document.getElementById("noteInput");
		var colorText=document.getElementById("colorInput");
		var mouseCoords=document.getElementById("mouseCoords");

		maindiv.onmousemove=function(e) {
			var pos=getMouseLocation(e, maindiv);
			//mouseCoords.value="["+e.clientX+", "+e.clientY+"]";
			mouseCoords.value="["+Math.round(pos.x)+", "+Math.round(pos.y)+"]";
			//console.log(pos);
			mousemovefire={'pos':pos, 'id':myid};
			//socket.emit('moved', {'pos':pos, 'id':myid});
		}
///////////////////////arduino
// 		maindiv.onmousedown=function(e) {
// 			var pos=getMouseLocation(e, maindiv);
// 			//console.log(pos);
// 			socket.emit('addNote', {
// 				'pos':pos, 
// 				'id':myid, 
// 				'text':noteText.value, 
// 				'noteId':myid+'_'+notes, 
// 				'style':{'backgroundColor':colorText.value}
// 			});
// 			notes++;
// 			///////my arduino test///
// 			console.debug("you just clicked");

// 			
// 			///////?///////////////////////////
// 		}


noteText.onkeyup=function() {
	socket.emit('setText', {'id':myid, 'text':noteText.value});
};


// colorText.oninput=function() {
// 	socket.emit('setStyleProperty', {'id':myid, 'property':'backgroundColor', 'value':colorText.value});
// }
}
);

socket.on('toggleDigital', function(data){
	//console.log( data["objId"] + " was toggled!");
	console.log( document.getElementById(data["objId"]) );
	var cb = document.getElementById(data["objId"]);
	cb.checked = !cb.checked;

});

socket.on('removeArduino', function(data){
	removeArduino(data["arduinoId"]);
});

socket.on('addArduino', function(data){
	//console.log("myArduino submitted")
	//myArduinoIds.push(data["newId"]);
	createArduinoPanel(data);
});
