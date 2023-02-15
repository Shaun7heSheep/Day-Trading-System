// simple localhost server
const express = require('express');
const path = require('path');
const { createServer } = require("http");
const { Server } = require("socket.io");


const app = express();
app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, '/index.html'));
});

const httpServer = createServer(app);
const io = new Server(httpServer, { /* options */ });
io.on('connection', newConnection);

function newConnection(socket){
  console.log('new connection')
  console.log(socket.id)
}

httpServer.listen(3000, () => console.log('Server is up and running'));


