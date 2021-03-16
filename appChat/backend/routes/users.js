const express = require('express');
const router = express.Router();
const Users = require('../models/usersModel')
const Activity = require('../models/activityModel')

// ****  Register New User  ****
router.post('/new', async (req,res) => {
   Users.findOne(
    {Name : req.body.name}, (err, data) => {
      if (err) {
        res.send(err)
      } else if (data <= 0) {
        Users.insertMany(
          {
            Name: req.body.name,
            Password: req.body.password, 
            Avatar: req.body.avatar,
            Type: 'User'
          }, (err, data) => {
            if (err) {
              console.log(err);
            } else {
              Activity.insertMany(
                {
                  UserId: data[0]._id,
                  Name: data[0].Name,
                  IsOnline: false,
                  Avatar: data[0].Avatar,
                  Type: 'User'
                }, (err, data) => {
                  if (err) {
                    res.send(err);
                  } else {
                    res.send({data: {message:'user creayed successfully', user: data}})
                  }
                }
              )
            }
          }
        );
      } else {
         res.json({data:{error:'user exits', user: data}});
      }
    })
})

// **** Login User ****
router.post('/login', async (req,res) => {
  await Users.findOne({$and: [ 
    {Name : req.body.name},
    {Password : req.body.password} ]}, (err, data) => {
      if (err) {
        res.json(err)
      } else if (data <= 0) {
        return res.json({valied: false, data: data})
      } else {
        return res.json({valied: true, data: data})
      }
    })
  })

  //  **** Get all Users
  router.get('/all', async (req, res) => {
    await Activity.find({}, (err, data) => {
      if (err) {
        res.send(err)
      } else {
        res.send(data)
      }
    })
  })


module.exports = router;