const mongoose = require('mongoose');

let Schema = mongoose.Schema

const usersSchema = new Schema({
    SocketId: String,
    Name: String,
    Password: String,
    Avatar: String,
    Online: Boolean,
    blackList: [String],
    blockedBy:[String],
    Groups: [String],
    Rooms: [String],
    ChatList: [String],
    Type: String
});

module.exports = mongoose.model('users', usersSchema)