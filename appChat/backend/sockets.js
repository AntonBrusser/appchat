const Activity = require("./models/activityModel");
const Users = require("./models/usersModel");

const Rooms = require("./models/roomsModel");
const Groups = require("./models/groupsModel");

exports.socketEvents = (io) => {
  io.on("connect", (socket) => {
    socket.join("appchat");

    // Go Online and Get All users info Live
    socket.on("loadUsers", ({ name }) => {
      Activity.updateOne(
        { Name: name },
        { $set: { IsOnline: true, SocketId: socket.id } },
        (err, data) => {
          if (err) {
            console.log(err);
          } else {
            Activity.find({}, (err, data) => {
              if (err) {
                throw err;
              } else {
                io.emit("users", data);
                Users.findOne({ Name: name }, (err, userData) => {
                  if (err) {
                    throw err;
                  } else {
                    // get all old messages:
                    Rooms.find(
                      { _id: { $in: userData.Rooms } },
                      (err, oldRooms) => {
                        if (err) {
                          throw err;
                        } else {
                          Groups.find(
                            { _id: { $in: userData.Groups} },
                            (err, oldGroups) => {
                              if (err) {
                                throw err;
                              } else {
                                let oldChats = oldRooms.concat(oldGroups);
                                socket.emit("chatList", oldChats);
                              }
                            }
                          );
                        }
                      }
                    );
                  }
                });
              }
            });
          }
        }
      );
    });

    // Get Companion Conversation
    socket.on("getCompanion", (selectedUser) => {
      Users.findOne({ Name: selectedUser }),
        (err, data) => {
          if (err) {
            throw err;
          } else {
            socket.emit("chosenCompanion", data);
          }
        };
    });

    // checking if the message is for Room or Group and sending it
    socket.on("sendMessage", async (message) => {
      let revPartners = message.Message.Partners.reverse();
      //  --> check if message sent to a User Room
      //      and if it is  - store it in the DataBase
      Rooms.findOne({ _id: message.Message.RoomId }, (err, data) => {
        if (err || data === null) {
          Groups.findOne({ _id: message.Message.RoomId }, (err, data) => {
            if (err || data === null) {
              // Room dosent exist so create the Room
              Rooms.insertMany(
                {
                  Partners: message.Message.Partners,
                  Messages: [
                    {
                      Message: message.Message.Text,
                      SenderName: message.Message.Sender,
                      Timestamp: message.Message.Timestamp,
                    },
                  ],
                },
                (err, roomDdata) => {
                  if (err) {
                    throw err;
                  } else {
                    // save room Id in both users arry of rooms
                    let roomID = roomDdata[0]._id.toString();
                    Users.find(
                      {
                        $or: [
                          { Name: revPartners[0].Name },
                          { Name: revPartners[1].Name },
                        ],
                      },
                      (err, data) => {
                        if (err) {
                          throw err;
                        } else {
                          let roomArr1 = data[0].Rooms;
                          let roomArr2 = data[1].Rooms;
                          Users.updateOne(
                            { Name: revPartners[0].Name },
                            { $set: { Rooms: [...roomArr1, roomID] } },
                            (err, data) => {
                              if (err) {
                                throw err;
                              } else {
                                Users.updateOne(
                                  { Name: revPartners[1].Name },
                                  { $set: { Rooms: [...roomArr2, roomID] } },
                                  (err, data) => {
                                    if (err) {
                                      throw err;
                                    }
                                  }
                                );
                              }
                            }
                          );
                        }
                      }
                    );
                    // emit the room data and message to the client

                    io.to("appchat").emit("UpdateRoomData", roomDdata[0]);
                  }
                }
              );
            } else {
              console.log("this is a group");
              let messageHistory = data.Messages;
              let newMessage = {
                GroupId: data._id,
                Message: message.Message.Text,
                SenderName: message.Message.Sender,
                Timestamp: message.Message.Timestamp,
              };
              Groups.updateOne(
                { _id: data._id },
                { $set: { Messages: [...messageHistory, newMessage] } },
                (err, messageData) => {
                  if (err) {
                    throw err;
                  } else {
                    Groups.findOne({ _id: data._id }, (err, data) => {
                      if (err) {
                        throw err;
                      } else {
                        console.log("new massage:::", newMessage);
                        io.to("appchat").emit(
                          "UpdateRoomNewMessage",
                          newMessage
                        );
                      }
                    });
                  }
                }
              );
            }
          });
        } else {
          // Room do exist, push the new massege to the history
          console.log("room do exists:::", data);
          let messageHistory = data.Messages;
          let newMessage = {
            roomId: data._id,
            Message: message.Message.Text,
            SenderName: message.Message.Sender,
            Timestamp: message.Message.Timestamp,
          };
          Rooms.updateOne(
            { _id: data._id },
            { $set: { Messages: [...messageHistory, newMessage] } },
            (err, messageData) => {
              if (err) {
                throw err;
              } else {
                console.log("messageData::::", messageData);
                Rooms.findOne({ _id: data._id }, (err, data) => {
                  if (err) {
                    throw err;
                  } else {
                    console.log("new massage:::", newMessage);
                    io.to("appchat").emit("UpdateRoomNewMessage", newMessage);
                  }
                });
              }
            }
          );
        }
      });
    });

    // Create New Group
    socket.on("createGroup", (Group) => {
      Groups.findOne({ Name: Group.Name }, (err, data) => {
        if (err || data === null) {
          Groups.insertMany(
            {
              Name: Group.Name,
              Avatar: Group.Avatar,
              Partners: Group.Partners,
              Messages: [
                {
                  Message: `Welcom to the ${Group.Name} Group`,
                  SenderName: "Admin",
                  Timestamp: "timeStamp",
                },
              ],
            },
            (err, groupData) => {
              if (err) {
                throw err;
              } else {
                let GroupId = groupData[0]._id.toString();
                Group.Partners.forEach((partner) => {
                  Users.findOne({ Name: partner.Name }, (err, data) => {
                    if (err) {
                      throw err;
                    } else {
                      let GroupsArr = data.Groups;
                      Users.updateOne(
                        { Name: partner.Name },
                        { $set: { Groups: [...GroupsArr, GroupId] } },
                        (err, data) => {
                          if (err) {
                            throw err;
                          } else {
                            console.log('new Group id:::', data)
                          }
                        }
                      );
                    }
                  });
                });
                console.log("GroupData:::", groupData);
                io.to("appchat").emit("UpdateGroupData", groupData[0]);
              }
            }
          );
        } else {
          console.log("group name taken");
          socket.emit(
            "GroupExists",
            "This Group name is taken. pleas choose another name"
          );
        }
      });
    });
    

        // Leave Group :
        socket.on("leaveGroup", (payload) => {
          let groupId = payload.GroupToLeaveId
          let userId = payload.MyId
          Groups.findOne({_id: groupId}, (err, data) => {
            if (err) {
              throw err
            } else {
              let oldPartners = data.Partners
              let newPartners = oldPartners.filter(partner => partner._id.toString() !== userId)
              Groups.updateOne(
                {_id: groupId},
                {$set: {Partners: newPartners}},
                (err, newData) => {
                  if (err) {
                    throw err
                  } else {
                    Users.findOne({_id: userId}, (err, userData) => {
                      if (err) {
                        throw err
                      } else {
                        let oldGroups = userData.Groups
                        let newGroups = oldGroups.filter( group => group !== groupId)
                        Users.updateOne(
                          {_id: userId},
                          {$set: {Groups: newGroups}},
                          (err, newUserData) => {
                            if (err) {
                              throw err
                            } else {
                              let adminMessage = {
                                  Message: ` ${userData.Name} has left the group`,
                                  SenderName: "Admin",
                                  Timestamp: "timeStamp",
                              }
                              let payload = {
                                groupId: data._id,
                                message: adminMessage
                              }
                              io.to("appchat").emit("userExitGroupData", payload);
                            }
                          }
                        )
                      }
                    })
                  }
                }
              )
            }
          })
        })

    

    // Block User
    socket.on("blockUser", (payload) => {
      let userName = payload.MyName
      let userToBlockName = payload.userToBlockName
      Users.findOne({Name: userName}, (err,data) => {
        if (err){
          throw error
        } else {
          console.log(data)
          let blacklist = data.blackList
          blacklist.push(userToBlockName)
          Users.updateOne(
            {Name: userName},
            {$set: {blackList: blacklist}},
            (err, newData) => {
              if (err) {
                throw err
              } else {
                Users.findOne({Name: userToBlockName}, (err,blockedData) => {
                  if (err) {
                    throw err
                  } else {
                    console.log(blockedData)
                    let blockedList = blockedData.blockedBy
                    blockedList.push(userName)
                    Users.updateOne(
                      { Name: userToBlockName},
                      {$set: {blockedBy: blockedList}},
                      (err, blacklistData) => {
                        if (err) {
                          throw err
                        } else {
                          console.log(blacklistData)
                          let blockData = {
                            blokerName: userName,
                            blokedName: userToBlockName
                          }
                          io.to("appchat").emit("blockData", blockData);
                        }
                      }
                    )
                  }
                })
              }
            }
          )
        }
      })
    })

    
    // Unblock User :
    socket.on('UnblockUser', (payload) => {
      let userName = payload.MyName
      let userToBlockName = payload.userToBlockName
      Users.findOne({Name: userName}, (err,data) => {
        if (err){
          throw error
        } else {
          console.log(data)
          let blacklist = data.blackList
          blacklist = blacklist.filter( user => user !== userToBlockName)
          Users.updateOne(
            {Name: userName},
            {$set: {blackList: blacklist}},
            (err, newData) => {
              if (err) {
                throw err
              } else {
                Users.findOne({Name: userToBlockName}, (err,blockedData) => {
                  if (err) {
                    throw err
                  } else {
                    let blockedByList = blockedData.blockedBy
                    blockedByList = blockedByList.filter( user => user !== userName)
                    Users.updateOne(
                      { Name: userToBlockName},
                      {$set: {blockedBy: blockedByList}},
                      (err, blacklistData) => {
                        if (err) {
                          throw err
                        } else {
                          let blockData = {
                            blokerName: userName,
                            blokedName: userToBlockName
                          }
                          io.to("appchat").emit("unblockData", blockData);
                        }
                      }
                    )
                  }
                })
              }
            }
          )
        }
      })
    })


    // Automaticly clear history if ther i more than 20 active chats
    socket.on("cleanHistory", (payload) => {
      Users.findOne({_id: payload.userID}, (err,data) => {
        if (err) {
          throw err
        } else {
          let oldRooms = data.Rooms
          let oldGroups = data.Groups
          if (oldRooms.includes(payload.chatID)) {
            newRooms = oldRooms.filter(room => room !== payload.chatID)
            Users.updateOne(
              {_id: payload.userID},
              {$set: {Rooms: newRooms}},
              (err,updatedRooms) => {
                if (err) {
                  throw err
                } else {
                  console.log(updatedRooms)
                }
              }
            )
          } else if (oldRooms.includes(payload.chatID)) {
            newGroups = oldGroups.filter(group => group !== payload.chatID)
            Users.updateOne(
              {_id: payload.userID},
              {$set: {Groups: newGroups}},
              (err,updatedGroups) => {
                if (err) {
                  throw err
                } else {
                  console.log(updatedGroups)
                }
              }
            )
          }
        }
      })
    })




    socket.on("disconnect", () => {
      Activity.updateOne(
        { SocketId: socket.id },
        { $set: { IsOnline: false } },
        (err, data) => {
          if (err) {
            console.log(err);
          } else {
            Activity.find({}, (err, data) => {
              if (err) {
                throw err;
              } else {
                io.emit("users", data);
              }
            });
          }
        }
      );
    });
  });
};
