const express = require('express');
const router = express.Router()
const { Device } = require('../models/device');
const Secretkey = "Secret777"
module.exports = router;

var now = new Date;
var utc_timestamp = Date.UTC(now.getUTCFullYear(),now.getUTCMonth(), now.getUTCDate() , 
      now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds(), now.getUTCMilliseconds());

router.use(express.json());

router.post('/register', async (request, response) => {
    const data = await Device.find({deviceid : request.body.deviceid});
    if(data.deviceid == request.body.deviceid){
        response.status(400).json({message: "user already registered"})
    }
    else {
    const registeruser = new Device({
        deviceid: request.body.deviceid,
        ownerid: request.body.ownerid,
        activeregion: [{ regionurl : request.body.regionurl, login_date: utc_timestamp }],
        created_at: utc_timestamp
    })
    
    try {
        const registerToSave = await registeruser.save();
        response.status(200).json({message: "success", access_token: "token333"});
    }
    catch (error) {
        response.status(400).json({message: error.message})
    }
  }
})

router.get('/token', async (req, res) => {
    if( req.secrets === Secretkey ){
        try{
            const userdata = await Login.find({deviceid: req.username});
            res.json(userdata)
        }
        catch(error){
            res.status(500).json({message: error.message})
        }

    }
})