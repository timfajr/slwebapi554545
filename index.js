const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
  cors: {
    origins: ['http://localhost:8080']
  }
});

var GlobaluserCount = [];
var videotime = '';
var status ='';
var host ='';

app.get('/', (req, res) => {
  res.send('<h1>Hey Socket.io</h1>');
});

io.on('connection', (socket) => {
    io.emit('message',"User Connected " + ++GlobaluserCount);
    io.emit('videotime',videotime);
    io.emit('totaluser',GlobaluserCount);
    console.log("User Connected " + GlobaluserCount);
    socket.on('disconnect', () => {
        io.emit('message',"User Connected " + --GlobaluserCount);
        io.emit('totaluser',GlobaluserCount);
        console.log("User Connected " + GlobaluserCount);
  });
  socket.on('videotime', (data) => {
    videotime = data
    console.log(data);  
});
socket.on('host', (data) => {
    host = data
    console.log(data);  
});
socket.on('status', (data) => {
    status = data
    console.log(data);  
});
  socket.on('event', (data) => {
    console.log('data masuk', data);
});
socket.on('message', function(data) {
    io.emit('message', 'Get you right back...')
    console.log(data);
});
});

setInterval(() => {
    io.emit("videotime", videotime);
    io.emit("status", status);
    io.emit("host", host);
}, 500);

http.listen(3000, () => {
  console.log('listening on *:3000');
});