const express = require('express');
const router = express.Router()
const { Device } = require('../models/device');
const Secretkey = "Secret777"
module.exports = router;

// JWT
const JWT_SECRET = process.env.TOKEN_SECRET;
const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;
const JWT_EXPIRATION_TIME = "1800s"
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const { response } = require('express');
dotenv.config();


function generateAccessToken( deviceid , ownerid ) {
    return jwt.sign( { deviceid , ownerid } , JWT_SECRET , { expiresIn: '1800s' });
  }

const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (authHeader) {
        const token = authHeader.split(' ')[1];

        jwt.verify(token, JWT_SECRET, (err, deviceid, ownerid) => {
            if (err) {
                return res.sendStatus(403);
            }
            req.body.deviceid = deviceid;
            req.body.ownerid = ownerid;
            next();
        });
    } else {
        res.sendStatus(401);
    }
};

var now = new Date;
var utc_timestamp = Date.UTC(now.getUTCFullYear(),now.getUTCMonth(), now.getUTCDate() , 
      now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds(), now.getUTCMilliseconds());

router.use(express.json());

router.post('/login', async (request, response) => {

    const data = await Device.find({deviceid : {$regex: request.body.deviceid}});
    if ( data[0].deviceid  ==  request.body.deviceid && data[0].ownerid == request.body.ownerid  ) {

        // generate an access token //
        const accessToken = generateAccessToken({ deviceid: request.body.deviceid , ownerid : request.body.ownerid });
        const refreshToken = jwt.sign({ deviceid: request.body.deviceid , ownerid : request.body.ownerid }, refreshTokenSecret);

        // Push to database here //
        const updatedData = { $set: {refresh_token: refreshToken} }
        const options = { new: true };
        const userdata = await Device.findOneAndUpdate({ deviceid : {$regex: request.body.deviceid}}, updatedData , options );

        response.status(200).json({ message: "success", access_token: accessToken , refresh_token: refreshToken });
    } else {
        response.status(400).json({ message: "failure" })
    }
});

router.post('/register', async (request, response) => { 
    const token = generateAccessToken({ deviceid: request.body.deviceid , ownerid : request.body.ownerid });
    const registeruser = new Device({
        deviceid: request.body.deviceid,
        ownerid: request.body.ownerid,
        activeregion: [{ regionurl : request.body.regionurl, login_date: utc_timestamp }],
        access_token: token,
        refresh_token: '',
        created_at: utc_timestamp
    })

    try {
        const data = await Device.find({ deviceid : { $regex: request.body.deviceid }});
        if(data[0] && data[0].deviceid == request.body.deviceid){
            response.status(400).json({ message: "user already registered !" })
        }
        else {
        const registerToSave = await registeruser.save();
        response.status(200).json({ message: "success", access_token: token });
        }
    }

    catch (error) {
        res.status(400).json({ message: error.message })
    }
})

router.get('/token', async (req, res) => {
        try{
            const userdata = await Login.find({ deviceid: req.username });
            res.json(userdata)
        }
        catch(error){
            res.status(500).json({ message: error.message })
        }
})