const express = require('express')
const router = express.Router()
const Admin = require('../models/admin')
const Moviedata = require('../models/moviedata')
const Device = require('../models/device')
const Transaction = require('../models/transaction')

const bcrypt = require("bcrypt")
module.exports = router
const Secretkey = "Secret777"

router.use(express.json())

'     ______       __                        '
'    / ____/___   / /_ ____  _      __ ____  '
'   / / __ / _ \ / __// __ \| | /| / // __ \ '
'  / /_/ //  __// /_ / /_/ /| |/ |/ // / / / '
'  \____/ \___/ \__/ \____/ |__/|__//_/ /_/  '
'                                            '

var now = new Date;
var utc_timestamp = Date.UTC(now.getUTCFullYear(),now.getUTCMonth(), now.getUTCDate() , 
      now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds(), now.getUTCMilliseconds())

// JWT 1 Day Expired
const JWT_SECRET = "810e447e4d33bb42a4378b0fbe0d77d2c75e0523b45731cf45d1ec1c4d435f4c"
const refreshTokenSecret = "920e447e4d33bb42a4378b0fbe0d77d3c75e0523b45731cf45d1ec1c4d435f4c"
const JWT_EXPIRATION_TIME = "1d"
const jwt = require('jsonwebtoken')

// Token 
function generateAccessToken( user ) {
    return jwt.sign( { user }, JWT_SECRET , { expiresIn: JWT_EXPIRATION_TIME })
}

const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.access_token
    if (authHeader) {
        const token = authHeader
        jwt.verify(token, JWT_SECRET, (err) => {
            if (err) {
                return res.status(403).send({ error: err.message })
            }
            next()
        })
    } else {
        res.sendStatus(401)
    }
}

// Register Admin
router.post("/register", async (req, res) => {
    const body = req.body

    if (!(body.username && body.password && body.secretkey)) {
      return res.status(400).send({ error: "Data not formatted properly" })
    }

    if ((body.secretkey != Secretkey)) {
        return res.status(400).send({ error: "Not Authorized" })
    }

    const data = await Admin.findOne({ username: body.username })

    if ((data)) {
        return res.status(400).send({ error: "Already Exist" })
    }

    // creating a new mongoose doc from user data
    const admin = new Admin(body)

    // generate salt to hash password
    const salt = await bcrypt.genSalt(10)

    // now we set user password to hashed password
    admin.password = await bcrypt.hash(admin.password, salt)

    admin.save()
    res.status(201).send({ message: "success" })

})

// Login
router.post('/login', async (request, response) => {
    const body = request.body;
    const data = await Admin.findOne({ username: body.username })
    if ( data ){
        const validPassword = await bcrypt.compare(body.password, data.password)
        if ( validPassword ) {

            // generate an access token //
            const accessToken = generateAccessToken({ username: request.body.username});
            const refreshToken = jwt.sign({ username: request.body.username}, refreshTokenSecret)
    
            // Push to database here //
            const updatedData = { $set: {refresh_token: refreshToken} }
            const options = { new: true }
            Admin.findOneAndUpdate({ username : {$regex: request.body.username}}, updatedData , options )
    
            response.status(200).json({ message: "success", access_token: accessToken , refresh_token: refreshToken })
        } else {
            response.status(400).json({ message: "wrong password" })
        }
    }
    else {
        response.status(400).json({ message: "admin not registered" })
    }
})

//Post Method
router.post('/post/movie', authenticateJWT , async (req, res) => {

    const data = new Moviedata({
        title: req.body.title,
        description: req.body.description,
        genre: req.body.genre,
        published: req.body.published,
        url: req.body.url,
        topick: req.body.topick,
        imgurl: req.body.imgurl
    })

    try {
        const dataToSave = await data.save()
        res.status(200).json(dataToSave)
    }

    catch (error) {
        res.status(400).json({message: error.message})
    }
})

// Pagination user table
router.get('/getdevices', authenticateJWT, async (req, res) => {
    // destructure page and limit and set default values
    const { page = 1, limit = 10 , sortBy = "_id"} = req.query;
    try {
        
      // execute query with page and limit values
      const devices = await Device.find({},{__v:0, activeregion:0 , access_token:0 ,refresh_token:0 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort(sortBy)
        .exec();
  
      // get total documents in the Posts collection 
      const count = await Device.countDocuments();
  
      // return response with posts, total pages, and current page
      res.json({
        devices,
        totalPages: Math.ceil(count / limit),
        totalitem: count,
        pageitem: limit ,
        currentPage: page
      });
    } catch (err) {
      console.error(err.message);
    }
  });

// Pagination user table
router.get('/gettransaction', authenticateJWT , async (req, res) => {
    // destructure page and limit and set default values
    const { page = 1, limit = 10 , sortBy = "_id"} = req.query;
    try {
        
      // execute query with page and limit values
      const devices = await Transaction.find({},{__v:0 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort(sortBy)
        .exec();
        
      // get total documents in the Posts collection 
      const count = await Transaction.countDocuments();

      // return response with posts, total pages, and current page
      res.json({
        devices,
        totalPages: Math.ceil(count / limit),
        totalitem: count,
        pageitem: limit ,
        currentPage: page
      });
    } catch (err) {
      console.error(err.message);
    }
  });

//Get all Admin
router.get('/getadmin', authenticateJWT , async (req, res) => {
    try {
        const data = await Admin.find({},{ password:0 , refresh_token:0 , __v:0 })
        res.json(data)
    }
    catch (error) {
        res.status(500).json({message: error.message})
    }
})

// Pagination movie table
router.get('/getAll', authenticateJWT , async (req, res) => {
    // destructure page and limit and set default values
    const { page = 1, limit = 12 , sortBy = "-created_at"} = req.query;
    try {
        
      // execute query with page and limit values
      const data = await Moviedata.find({},{__v:0})
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort(sortBy)
        .exec();
  
      // get total documents in the Posts collection 
      const count = await Moviedata.countDocuments();
  
      // return response with posts, total pages, and current page
      res.json({
        data : data,
        totalPages: Math.ceil(count / limit),
        totalitem: count,
        pageitem: limit ,
        currentPage: page
      });
    } catch (err) {
      console.error(err.message);
    }
});


//Update by ID Method
router.patch('/update/:id', authenticateJWT, async (req, res) => {
    try {
        const id = req.params.id
        const updatedData = req.body
        const options = { new: true }

        const result = await Model.findByIdAndUpdate(
            id, updatedData, options
        )

        res.send(result)
    }
    catch (error) {
        res.status(400).json({ message: error.message })
    }
})

//Delete by ID Method
router.delete('/delete/:id', authenticateJWT, async (req, res) => {
    try {
        const id = req.params.id;
        const data = await Model.findByIdAndDelete(id)
        res.send(`Document with ${data.name} has been deleted..`)
    }
    catch (error) {
        res.status(400).json({ message: error.message })
    }
})

router.post('/token', authenticateJWT , async (req, res) => {
    res.status(200).json({ message: "success"})
})