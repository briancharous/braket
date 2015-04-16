var socket = io();

var onBump = function() {
    if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(function(position) {
            lat = position.coords.latitude;
            lon = position.coords.longitude;
            timestamp = new Date().getTime();
            socket.emit('bump', {'lat': lat, 'lon': lon, 'ts':timestamp});
        });
    }
    else {
        // Handle not having position data here
    }
}

socket.on('response', function(message) {
    var status = message.status;
    console.log(message);
    if (status == 1) {
        alert('found a match!');
    }
    else if (status == 0) {
        alert('no match found');
    }
    window.addEventListener('devicemotion', handleMotion, true);
//     console.log("it's here");
//     console.log(message); 
});



var prevSlope = [0,0,0];
var prevAccel = [0,0,0];
var threshold = 11;
function handleMotion(event) {
    var accel = event.acceleration;
    var slope = [accel.x - prevAccel[1], accel.y - prevAccel[1], accel.z - prevAccel[2]]
    for (var i=0; i<3; i++) {
        var s = slope[i];
        var ps = prevSlope[i];
        var delta = Math.abs(s - ps);
        // check if the slopes are opposite by multiplying together and checking if < 0
        if ((delta > threshold) && (s*ps < 0)) {
            console.log('bump detected');
            window.removeEventListener('devicemotion', handleMotion, true);
            prevSlope = [0,0,0];
            prevAccel = [0,0,0];
            onBump();
            break;
        }
        prevSlope[i] = s;
    }
}

window.addEventListener('devicemotion', handleMotion, true);