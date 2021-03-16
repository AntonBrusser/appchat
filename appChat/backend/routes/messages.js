const express = require('express');
const router = express.Router();
const Messages = require('../models/messagesModel')


router.get('/', (req,res) => {
    res.status(200).send('hello World Messages')
})



router.get('/sync', (req,res) => {
    Messages.find((err,data) => {
        if (err) {
            res.status(500).send(err)
        } else {
            res.status(200).send(data)
        }
    })
})


router.post('/new', (req,res) => {
    const dbMessage = req.body
    console.log(dbMessage);

    Messages.create(dbMessage, (err, data) => {
        if (err) {
            res.status(500).send(err)
        } else {
            res.status(201).send(`new message created: ${data}`)
        }
    })
})

router.get('/new', (req, res) => {
    res.send('get new message')
})


module.exports = router;