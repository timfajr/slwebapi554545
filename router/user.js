const express = require('express')
const router = express.Router()
const Device = require('../models/device')
const Transaction = require('../models/transaction')
const Requestmovie = require('../models/requestmovie')
module.exports = router

// JWT 30 Day Expired
const JWT_SECRET = "810e447e4d33bb42a4378b0fbe0d77d2c75e0523b45731cf45d1ec1c4d435f4c"
const refreshTokenSecret = "920e447e4d33bb42a4378b0fbe0d77d3c75e0523b45731cf45d1ec1c4d435f4c"
const JWT_EXPIRATION_TIME = "30d"
const jwt = require('jsonwebtoken')
const { response } = require('express')

function generateAccessToken( device ) {
    return jwt.sign( { device }, JWT_SECRET , { expiresIn: JWT_EXPIRATION_TIME })
  }

const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.access_token
    if (authHeader) {
        const token = authHeader
        jwt.verify(token, JWT_SECRET, (err, decoded) => {
            if (err) {
                return res.status(403).send({ error: err.message })
            }
            next()
        })
    } else {
        res.sendStatus(401)
    }
}

var now = new Date
var utc_timestamp = Date(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate(),now.getUTCHours())

var setday30 = now.setDate(now.getDate() + 30)
var date30 = new Date(setday30)
var datenow = new Date(utc_timestamp)

/// Early Mechanics Per Month
const daysinms = (1000 * 60 * 60 * 24)
const Hourimms = (1000 * 60 * 60)

router.use(express.json())

// Need Rework
router.post('/login', async (request, response) => {
    const data = await Device.findOne( { ownerid : { $regex: request.body.ownerid }} )
    const devicedata = await Device.findOne({ 'devices.deviceid' : { $regex: request.body.deviceid } })
    if ( data && devicedata ){
        if ( data.ownerid  ==  request.body.ownerid ) {

            // generate an access token //
            const accessToken = generateAccessToken({ deviceid: request.body.deviceid , ownerid : request.body.ownerid })
            const refreshToken = jwt.sign({ deviceid: request.body.deviceid , ownerid : request.body.ownerid }, refreshTokenSecret)
    
            // Push to database here //
            const updatedData = { $set: {refresh_token: refreshToken} }
            const options = { new: true }
            const userdata = await Device.findOneAndUpdate({ deviceid : {$regex: request.body.deviceid}}, updatedData , options )
    
            response.status(200).json({ message: "success", access_token: accessToken , refresh_token: refreshToken })
        } else {
            response.status(400).json({ message: "failure" })
        }
    }
    else {
        response.status(400).json({ message: "device not regitered" })
    }
})

// DONE UPDATE SUBS Mechanics
router.post('/register', async (request, response) => { 
    const token = generateAccessToken({ deviceid: request.body.deviceid , ownerid : request.body.ownerid })
    const timeDifference= Math.abs(date30.getTime() - datenow.getTime())
    const registeruser = new Device({
        ownerid: request.body.ownerid,
        subscription: 'active',
        devices: [{ 
            deviceid: request.body.deviceid,
            activeregion: [
                { regionurl : request.body.regionurl, login_date: datenow 
            }]
        }],
        refresh_token: '',
        expires: date30,
        timeleft: Math.ceil(timeDifference / daysinms),
        transaction: [],
        total_watch: 0,
        balance: 0,
        secret : Date.now().toString(36),
        created_at: datenow
    })

    try {
        const ownerdata = await Device.find({ ownerid : { $regex: request.body.ownerid }})
        if(ownerdata[0] && ownerdata[0].ownerid == request.body.ownerid){
            
            const devicedata = await Device.findOne({ 'devices.deviceid' : { $regex: request.body.deviceid } })

            // IF Device Registered
            if( devicedata ){
                response.status(400).json({ message: "device already registered !" })
            }

            // Register New Devices
            else {
                const updatedData = { 
                    $push: 
                    { 'devices' : [{
                        deviceid: request.body.deviceid,
                        activeregion: [
                            { regionurl : request.body.regionurl, login_date: datenow }
                        ]}
                    ]}
                }
                const options = { new: true }
                const updatedata = await Device.findOneAndUpdate({ ownerid : {$regex: request.body.ownerid}}, updatedData , options )
                response.status(200).json({ message: "new device registered", access_token: token, data : updatedData})
            }
        }

        else {
        const registerToSave = await registeruser.save()
        response.status(200).json({ message: "success", access_token: token })
        }

    }

    catch (error) {
        response.status(400).json({ message: error.message })
    }
})

// DONE TEST SUBS MECHANICS
// Protection Required
// Integrated To Transaction + Ready For Inworld Eror Handling

router.post('/inworld/30daysub', async (request, response) => {
    const data = await Device.findOne( { ownerid : { $regex: request.body.ownerid }} )
    const itemprice = 300
    const qty = 1

    try{
        var date30 = new Date(data.expires)
        var setday = date30.setDate(date30.getDate() + 30)
        var updateday = new Date(setday)
        const timeDifference= Math.abs(updateday.getTime() - datenow.getTime())
        const updatedData = { 
            $set: 
            {
                'subscription' : "active",
                'expires' : setday,
                'timeleft' : Math.ceil(timeDifference / daysinms)
            }
        }
        const options = { new: false }
        const updatedata = await Device.findOneAndUpdate({ ownerid : {$regex: request.body.ownerid}}, updatedData , options )
        const result = await Device.findOne({ ownerid : {$regex: request.body.ownerid}})

        try{
            const transaction = new Transaction({
                ownerid: request.body.ownerid,
                item: 'subs30',
                quantity: qty,
                price: itemprice,
                total: itemprice * qty,
                gift: false,
                gift_ownerid: ''
            })
            const updatedData = { 
                $push: 
                {
                    'transaction' : [{
                        ownerid: request.body.ownerid,
                        item: 'subs30',
                        quantity: qty,
                        price: itemprice,
                        total: itemprice * qty,
                        gift: false,
                        gift_ownerid: ''
                    }]
                }
            }
            const options = { new: true }
            const transactiondone = await transaction.save()
            const updatedata = await Device.findOneAndUpdate({ ownerid : {$regex: request.body.ownerid}}, updatedData , options )
            response.status(200).json({ message: 'success', ownerid: request.body.ownerid , item : 'subs30' , ammount: "L$ "+ transactiondone.total , timeleft: result.timeleft +" Day", created_at: new Date(transactiondone.created_at).toISOString().replace(/T/, ' ').replace(/\..+/, '') })
        }
        catch(error){
            response.status(500).json({ message: error.message })
        }
    }
    catch(error){
        response.status(500).json({ message: error.message })
    }
})

// Balance Integration Done
// Need To Check Eror later
// Integrate with Transaction
// Need To check User not found
router.post('/30daysub', async (request, response) => {
    const data = await Device.findOne( { ownerid : { $regex: request.body.ownerid }} )
    const itemprice = 300
    const qty = 1
    if ( data.balance >= itemprice ){
    try {
        var date30 = new Date(data.expires)
        var setday = date30.setDate(date30.getDate() + 30)
        var updateday = new Date(setday)
        const timeDifference= Math.abs(updateday.getTime() - datenow.getTime())
        const updatedData = { 
            $set: 
            {
                'subscription' : "active",
                'expires' : setday,
                'timeleft' : Math.ceil(timeDifference / daysinms),
                'balance' : data.balance - itemprice
            }
        }
        const options = { new: false }
        const updatedata = await Device.findOneAndUpdate({ ownerid : {$regex: request.body.ownerid}}, updatedData , options )
        const result = await Device.findOne({ ownerid : {$regex: request.body.ownerid}})
        try {
            const transaction = new Transaction({
                ownerid: request.body.ownerid,
                item: 'subs30',
                quantity: qty,
                price: itemprice,
                total: itemprice * qty,
                gift: false,
                gift_ownerid: ''
            })
            const updatedData = { 
                $push: 
                {
                    'transaction' : [{
                        ownerid: request.body.ownerid,
                        item: 'subs30',
                        quantity: qty,
                        price: itemprice,
                        total: itemprice * qty,
                        gift: false,
                        gift_ownerid: ''
                    }]
                }
            }
            const options = { new: true }
            const transactiondone = await transaction.save()
            const updatedata = await Device.findOneAndUpdate({ ownerid : {$regex: request.body.ownerid}}, updatedData , options )
            response.status(200).json({ message: 'success', ownerid: request.body.ownerid , item : 'subs30' , ammount: "L$ "+ transactiondone.total, timeleft: result.timeleft +" Day", created_at: new Date(transactiondone.created_at).toISOString().replace(/T/, ' ').replace(/\..+/, '') })
        }
        catch(error){
            response.status(500).json({ message: error.message })
        }
    }
    catch(error){
        response.status(500).json({ message: error.message })
    }
    }
    else{
        response.status(500).json({ message: "balance not enough" })
    }
})

// Topup
// Protected with Secretkey
router.post('/topup', async (request, response) => {
    const data = await Device.findOne( { ownerid : { $regex: request.body.ownerid }} )
    const ammount = request.body.ammount
    console.log(data)
    const qty = 1
    if ( data && ammount && data.secret == request.body.secret ) {
    try {

        const updatedData = { 
            $set: 
            {
                'balance' : data.balance + ammount
            }
        }

        const options = { new: false }
        const updatedatax = await Device.findOneAndUpdate({ ownerid : {$regex: request.body.ownerid}}, updatedData , options )
        const result = await Device.findOne({ ownerid : {$regex: request.body.ownerid}})
        
        try {
            const transaction = new Transaction({
                ownerid: request.body.ownerid,
                item: 'topup',
                quantity: qty,
                price: ammount,
                total: ammount * qty,
                gift: false,
                gift_ownerid: ''
            })
            const updatedData = { 
                $push: 
                {
                    'transaction' : [{
                        ownerid: request.body.ownerid,
                        item: 'topup',
                        quantity: qty,
                        price: ammount,
                        total: ammount * qty,
                        gift: false,
                        gift_ownerid: ''
                    }]
                }
            }
            const options = { new: true }
            const transactiondone = await transaction.save()
            const updatedatax = await Device.findOneAndUpdate({ ownerid : {$regex: request.body.ownerid}}, updatedData , options )
            response.status(200).json({ message: 'success', ownerid: request.body.ownerid , item : 'topup' , ammount: "L$ "+ transactiondone.total, balance: "L$ "+ result.balance,timeleft: result.timeleft +" Day", created_at: new Date(transactiondone.created_at).toISOString().replace(/T/, ' ').replace(/\..+/, '') })
        }
        catch(error){
            response.status(500).json({ message: error.message })
        }
    }
    
    catch(error){
        response.status(500).json({ message: error.message })
    }

    }
    else {
        response.status(500).json({ message: "user not registered / request not correct" })
    }
})

router.get('/token', async (request, response) => {
        const decoded = jwt.verify(request.headers.access_token, JWT_SECRET)
        try{
            const userdata = await Login.find({ deviceid : { $regex: decoded.device.deviceid }})
            response.json(userdata)
        }
        catch(error){
            response.status(500).json({ message: error.message })
        }
})

router.post('/requestmovie', async (request, response) => {
    try{
        const data = new Requestmovie({
            ownerid: request.body.ownerid,
            requestedmovie: request.body.requestedmovie,
            message: request.body.message
        })
        const transactiondone = await data.save()
        response.json(transactiondone)
    }
    catch(error){
        response.status(500).json({ message: error.message })
    }
})

router.get('/requestmovie', async (request, response) => {
    try{
        const userdata = await Requestmovie.find({},{__v:0 , _id:0})
        response.json(userdata)
    }
    catch(error){
        response.status(500).json({ message: error.message })
    }
})

router.get('/me', authenticateJWT, async (request, response) => { 
    const decoded = jwt.verify(request.headers.access_token, JWT_SECRET)
    try {
        const data = await Device.findOne( { 'devices.deviceid' : { $regex: decoded.device.deviceid }} , {__v:0,ownerid:0,created_at:0,access_token:0,refresh_token:0,_id:0, devices:0} )
        if ( data ){
            response.status(200).json({ message : "success"})
        }
        else {
            response.status(400).json({ message: error.message })
        }
    }

    catch (error) {
        response.status(400).json({ message: error.message })
    }
})
