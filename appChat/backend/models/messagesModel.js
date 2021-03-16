const mongoose = require('mongoose');
let Schema = mongoose.Schema

const messagesSchema = new Schema({
    Message: String,
    Name: String,
    Timestamp: String
});

module.exports = mongoose.model('messages', messagesSchema)