const express = require('express')
const router = express.Router()
const Device = require('../models/device')
const Transaction = require('../models/transaction')
const Requestmovie = require('../models/requestmovie')
module.exports = router

// JWT 30 Day Expired
const JWT_SECRET = "810e447e4d33bb42a4378b0fbe0d77d2c75e0523b45731cf45d1ec1c4d435f4c"
const refreshTokenSecret = "920e447e4d33bb42a4378b0fbe0d77d3c75e0523b45731cf45d1ec1c4d435f4c"
const JWT_EXPIRATION_TIME = "3d"
const jwt = require('jsonwebtoken')
const { response } = require('express')

function generateAccessToken( device ) {
    return jwt.sign( { device }, JWT_SECRET , { expiresIn: JWT_EXPIRATION_TIME })
  }

const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.access_token
    console.log(authHeader)
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

var setday30 = now.setDate(now.getDate() + 6 ) // 7 Day For New User
var date30 = new Date(setday30)
var datenow = new Date(utc_timestamp)

/// Early Mechanics Per Month
const daysinms = (1000 * 60 * 60 * 24)
const Hourimms = (1000 * 60 * 60)

router.use(express.json())

// Need Rework
router.post('/login', async (request, response) => {
    const data1 = await Device.findOne( { ownerid : { $regex: request.body.ownerid }} )
    const devicedata = await Device.findOne({ 'devices.deviceid' : { $regex: request.body.deviceid } })
    if ( data1 && devicedata ){
        if ( data1.ownerid  ==  request.body.ownerid ) {

            // Checking subcription time
            var dateex = new Date(data1.expires)
            var setday = dateex .setDate(dateex.getDate())
            var updateday = new Date(setday)
            const timeDifference = updateday.getTime() - datenow.getTime()

            // Save Subcription Data
            if ( timeDifference <= 0 ) {
                const updatedData = { 
                    $set: 
                    {
                        'subscription' : "expired",
                        'timeleft': 0
                    }
                }
                const options = { new: false }
                const updatedata = await Device.findOneAndUpdate({ ownerid : {$regex: request.body.ownerid}}, updatedData , options )
            }

            // Save Subcription Data
            if ( timeDifference >= 1 ) {
                const updatedData = { 
                    $set: 
                    {
                        'subscription' : "active",
                        'timeleft' : Math.ceil( timeDifference / daysinms )
                    }
                }
                const options = { new: false }
                const updatedata = await Device.findOneAndUpdate({ ownerid : {$regex: request.body.ownerid}}, updatedData , options )
            }
            const userExist = data1.username

            // Checking if username is registered ( update database / removed in future after whole set filled )
            if ( !userExist ) {
                const updatedUser = { 
                    $set: 
                    {
                        'username' : request.body.username
                    }
                }
                const options = { new: false }
                const updatedata = await Device.findOneAndUpdate({ ownerid : {$regex: request.body.ownerid}}, updatedUser , options )
            }
            
            // generate an access token //
            const data2 = await Device.findOne( { ownerid : { $regex: request.body.ownerid }} )
            const accessToken = generateAccessToken({ deviceid: request.body.deviceid , ownerid : request.body.ownerid, timeleft: data2.timeleft })
            const refreshToken = jwt.sign({ deviceid: request.body.deviceid , ownerid : request.body.ownerid, timeleft: data2.timeleft }, refreshTokenSecret)
    
            // Push to database here //
            const updatedData = { $set: {refresh_token: refreshToken} }
            const options = { new: true }
            const userdata = await Device.findOneAndUpdate({ deviceid : {$regex: request.body.deviceid}}, updatedData , options )
    
            response.status(200).json({ message: "success", access_token: accessToken , refresh_token: refreshToken , key: devicedata.secret , timeleft: data2.timeleft  })
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
        username: request.body.username,
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
                        username: request.body.username,
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
// Update Null Safety & Negative Value Safety

router.post('/inworld/30daysub', async (request, response) => {
    const data = await Device.findOne( { ownerid : { $regex: request.body.ownerid }} )
    const itemprice =  700
    const qty = request.body.qty || 0
    const options = { new: true }

    if (data && qty == 0 && request.body.secret == data.secret) {
        try {
            var date30 = new Date(data.expires)
            var setday = date30.setDate(date30.getDate() + ( 30 * qty ) )
            var updateday = new Date(setday)
            const timeDifference= updateday.getTime() - datenow.getTime()
            var updatedData= {}
            updatedData = { 
                $set: 
                {
                    'subscription' : "active",
                    'expires' : setday,
                    'timeleft' : Math.ceil( timeDifference / daysinms)
                }
            }
            const updatedata = await Device.findOneAndUpdate({ ownerid : {$regex: request.body.ownerid}}, updatedData , options )
            const result = await Device.findOne({ ownerid : {$regex: request.body.ownerid}})
            response.status(200).json({ message: 'success', ownerid: request.body.ownerid , timeleft: result.timeleft +" Day"})
        }
        catch(error){
            response.status(500).json({ message: error.message })
        }
    }

    if (data && qty >= 1 && request.body.secret == data.secret){
        try {
            var date30 = new Date(data.expires)
            var setday = date30.setDate(date30.getDate() + ( 30 * qty ) )
            var updateday = new Date(setday)
            const timeDifference = updateday.getTime() - datenow.getTime()
            if ( timeDifference <= 0 ){
                var date30 = new Date(datenow)
                var setday = date30.setDate(date30.getDate() + ( 30 * qty ) )
                var updateday = new Date(setday)
                const timeDifference= updateday.getTime() - datenow.getTime()
                updatedData = { 
                    $set: 
                    {
                        'subscription' : "active",
                        'expires' : setday,
                        'timeleft' : Math.ceil( timeDifference / daysinms)
                    }
                }
            }
            else {
                updatedData = { 
                    $set: 
                    {
                        'subscription' : "active",
                        'expires' : setday,
                        'timeleft' : Math.ceil( timeDifference / daysinms)
                    }
                }
            }
            const options = { new: false }
            const updatedata = await Device.findOneAndUpdate({ ownerid : {$regex: request.body.ownerid}}, updatedData , options )
            var dataitem = "subs_" + (30 * qty) +"_day"
            var totalprice = 700
            if (qty == 3)
            {
                totalprice = 2000
            }
            else if (qty == 6)
            {
                totalprice = 3800
            }
            else if (qty == 12)
            {
                totalprice = 7500
            }
            else {
                totalprice = itemprice * qty
            }
            try {
                const transaction = new Transaction({
                    ownerid: request.body.ownerid,
                    username: data.username,
                    item: dataitem,
                    quantity: qty,
                    price: itemprice,
                    total: totalprice,
                    gift: false,
                    gift_ownerid: ''
                })
                const updatedData = { 
                    $push: 
                    {
                        'transaction' : [{
                            ownerid: request.body.ownerid,
                            username: data.username,
                            item: dataitem,
                            quantity: qty,
                            price: itemprice,
                            total: totalprice,
                            gift: false,
                            gift_ownerid: ''
                        }]
                    }
                }
                const transactiondone = await transaction.save()
                const updatedata = await Device.findOneAndUpdate({ ownerid : {$regex: request.body.ownerid}}, updatedData , options )
                const result = await Device.findOne({ ownerid : {$regex: request.body.ownerid}})
                response.status(200).json({ message: 'success', ownerid: request.body.ownerid , item : dataitem , ammount: "L$ "+ transactiondone.total , timeleft: result.timeleft +" Day", created_at: new Date(transactiondone.created_at).toISOString().replace(/T/, ' ').replace(/\..+/, '') })
            }
            catch(error){
                response.status(500).json({ message: error.message })
            }
        }
        catch(error){
            response.status(500).json({ message: error.message })
        }
    }
    else if (data &&  qty <= -1) {
        response.status(500).json({ message: "Illegal value - Reported" })
    }
    else if (data && request.body.secret != data.secret) {
        response.status(500).json({ message: "Not Authorized - Reported" })
    }
    else if (!data) {
        response.status(500).json({ message: "Data Not Found" })
    }
})

// Balance Integration Done
// Need To Check Eror later
// Integrate with Transaction
// Need To check User not found
router.post('/30daysub', async (request, response) => {
    const data = await Device.findOne( { ownerid : { $regex: request.body.ownerid }} )
    const itemprice = 700
    const qty = request.body.qty || 1
    if ( data.balance >= itemprice ){
    try {
        var date30 = new Date(data.expires)
        var setday = date30.setDate(date30.getDate() + ( 30 * qty ) )
        var updateday = new Date(setday)
        const timeDifference= updateday.getTime() - datenow.getTime()
        var updatedData= {}
        if ( timeDifference <= 0 ){
            console.log('hit')
            var date30 = new Date(datenow)
            var setday = date30.setDate(date30.getDate() + ( 30 * qty ) )
            var updateday = new Date(setday)
            const timeDifference= updateday.getTime() - datenow.getTime()
            updatedData = { 
                $set: 
                {
                    'subscription' : "active",
                    'expires' : setday,
                    'timeleft' : Math.ceil( timeDifference / daysinms),
                    'balance' : data.balance - itemprice
                }
            }
        }
        else {
            updatedData = { 
                $set: 
                {
                    'subscription' : "active",
                    'expires' : setday,
                    'timeleft' : Math.ceil( timeDifference / daysinms) ,
                    'balance' : data.balance - itemprice
                }
            }
        }
        const options = { new: false }
        const updatedata = await Device.findOneAndUpdate({ ownerid : {$regex: request.body.ownerid}}, updatedData , options )
        const result = await Device.findOne({ ownerid : {$regex: request.body.ownerid}})
        try {
            const transaction = new Transaction({
                ownerid: request.body.ownerid,
                username: result.username,
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
                        username: result.username,
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
                username: result.username,
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
                        username: result.username,
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
            username: request.body.username,
            requestedmovie: request.body.requestedmovie,
            movieyear: request.body.movieyear,
            message: request.body.message,
            status: "pending"
        })
        const requestdone = await data.save()
        response.json(requestdone)
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
        const data = await Device.findOne( { 'devices.deviceid' : { $regex: decoded.device.deviceid }},{__v:0,created_at:0,access_token:0,refresh_token:0,_id:0, devices:0})
        if ( data ){
            if ( data.transaction.length !== 0 ){
                const transaction = await Device.aggregate([
                    { $match: { 'devices.deviceid': { $regex: decoded.device.deviceid } }},
                    { $unwind: '$transaction' },
                    { $sort: { 'transaction.created_at': -1 }},
                    { $group: { _id: '$_id', transaction: { $push: '$transaction'}}}])
                if( transaction.length !== 0 ){
                        console.log('hit')
                        var total = 0;
                        for (i in transaction[0].transaction) {
                            total += transaction[0].transaction[i].total;
                        }
                        response.status(200).json({ message : data,totaltransaction : total , transaction: transaction[0].transaction})
                 }
            }
            else {
                response.status(200).json({ message : data })
            }
        }
        else {
            response.status(400).json({ message: error.message})
        }
    }
    catch (error) {
        response.status(400).json({ message: error.message })
    }
})
