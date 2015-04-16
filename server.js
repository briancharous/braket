var express = require('express');
var app = express();
app.use(express.static('static'));

var http = require('http').Server(app);
var io = require('socket.io')(http);

var bumps = [];
var DISTANCE_THRESHOLD = 0.001;
var TIME_THRESHOLD = 1000; // threshold of about .5 seconds

// Express stuff
app.get('/', function(request, response) {
    response.sendFile(__dirname + '/static/home.html');
});

http.listen((process.env.PORT || 5000), function() {
    console.log('listening');
});

// socket.io stuff
io.on('connection', function(socket) {
    console.log('a user connected');
    socket.on('bump', function(message) {
        console.log(message);
        bump = {lat: message.lat, lon: message.lon, ts: message.ts, socket: socket.id};
        checkForMatches(bump);
    });
});

var checkForMatches = function(newBump) {
    for (var i=0; i<bumps.length; i++) {
        var b = bumps[i];
        var distDelta = Math.sqrt(Math.pow(b.lat - newBump.lat, 2) + Math.pow(b.lon - newBump.lon, 2));
        var timeDelta = Math.abs(b.ts - newBump.ts);
        if (distDelta < DISTANCE_THRESHOLD && timeDelta < TIME_THRESHOLD) {
            console.log("found a match: " + b.socket + ", " + newBump.socket);
            if (io.sockets.connected.hasOwnProperty(b.socket)) {
                io.sockets.connected[b.socket].emit('response', {'status':1});
            }
            if (io.sockets.connected.hasOwnProperty(newBump.socket)) {
                io.sockets.connected[newBump.socket].emit('response', {'status':1});
            }
            bumps.splice(i, 1); // remove old bump from array
            return;
        }
    }
    bumps.push(newBump);
}

setInterval(function() {
    for (var i=0; i<bumps.length; i++) {
        var b = bumps[i];
        var delta = new Date().getTime() - b.ts;
        if (delta > 2000) {
            bumps.splice(i, 1);
            if (io.sockets.connected.hasOwnProperty(b.socket)) {
                io.sockets.connected[b.socket].emit('response', {status:0});
            }
        }
    } 
}, 5000);