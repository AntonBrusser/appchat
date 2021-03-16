const mongoose = require('mongoose');
let Schema = mongoose.Schema

const groupSchema = new Schema({
    Name: String,
    Avatar: String,
    Admins: [{
        Name: String,
        UserId: String
    }],
    Partners: [{
        Name: String,
        PartnerId: String
    }],
    Messages: [{
        Message: String,
        SenderName: String,
        Timestamp: String
    }]

});

module.exports = mongoose.model('groups', groupSchema)