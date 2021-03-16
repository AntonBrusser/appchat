const mongoose = require('mongoose');
let Schema = mongoose.Schema

const roomsSchema = new Schema({

    Partners: [{
        Name: String,
        IsOnline: String,
        Type: String,
        Avatar: String
    }],
    Messages: [{
        Message: String,
        SenderName: String,
        Timestamp: String
    }]
});

module.exports = mongoose.model('rooms', roomsSchema)