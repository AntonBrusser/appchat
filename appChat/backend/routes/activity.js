const express = require('express');
const router = express.Router();
const Activity = require('../models/activityModel')

//  **** Get all chat activity
router.get('/all', async (req, res) => {
    await Activity.find({}, (err, data) => {
      if (err) {
        res.send(err)
      } else {
        res.send(data)
      }
    })
  })


//  **** Update chat activity ****






module.exports = router;