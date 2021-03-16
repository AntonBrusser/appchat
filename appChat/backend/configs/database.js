const mongoose = require('mongoose');

const connection_url = 'mongodb+srv://admin:Aab6139998@cluster0.3kcoo.mongodb.net/appchatdb?retryWrites=true&w=majority'

mongoose.connect(connection_url, {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true
})

const db = mongoose.connection

db.once('open', () => {
    console.log('DB is connected');
})