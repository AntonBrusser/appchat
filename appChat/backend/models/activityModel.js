const mongoose = require('mongoose');
let Schema = mongoose.Schema

const activitySchema = new Schema({
    UserId: String,
    Name: String,
    Avatar: String,
    LastSeen: String,
    SocketId: String,
    IsOnline: Boolean,
    Type: String
});

module.exports = mongoose.model('activity', activitySchema)