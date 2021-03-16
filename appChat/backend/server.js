// importing
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const cors = require('cors');



const usersRouter = require('./routes/users')
const roomsRouter = require('./routes/rooms')
const groupsRouter = require('./routes/groups')
const messagesRouter = require('./routes/messages')
const activityRouter = require('./routes/activity')


const app = express();
const server = http.createServer(app);


app.use(cors());
const bodyParser = require('body-parser')
require('./configs/database')
app.use(bodyParser.urlencoded({extended : true}))
app.use(bodyParser.json())




app.use('/users', usersRouter);
app.use('/rooms', roomsRouter);
app.use('/groups', groupsRouter);
app.use('/messages', messagesRouter);
app.use('/activity', activityRouter);


// io
const io = socketio(server, {
  cors: {
    origin: "http://localhost:9000",
    methods: ["GET", "POST"]
}
});
io.use(async (socket, next) => {
    try {
      next();
    } catch (err) {}
  });
const sockets = require('./sockets')
sockets.socketEvents(io)


// listen
server.listen(process.env.PORT || 9000, () => console.log(`Server has started`));