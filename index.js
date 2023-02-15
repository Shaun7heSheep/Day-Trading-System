//client.js
var io = require('socket.io-client');
var socket = io.connect('quoteserve.seng.uvic.ca:4444', {reconnect: true});

// Add a connect listener
socket.on("connect_error", (error) => {
    console.log('Cannot connect!');
});
socket.on('connect', function (socket) {
    console.log('Connected!');
});
socket.emit('CH01', 'me', 'test msg');

