const express = require('express');
const router = express.Router()
const Moviedata = require('../models/moviedata');
module.exports = router;

'     ______       __                        '
'    / ____/___   / /_ ____  _      __ ____  '
'   / / __ / _ \ / __// __ \| | /| / // __ \ '
'  / /_/ //  __// /_ / /_/ /| |/ |/ // / / / '
'  \____/ \___/ \__/ \____/ |__/|__//_/ /_/  '
'                                            '

// JWT 30 Day Expired
const JWT_SECRET = "810e447e4d33bb42a4378b0fbe0d77d2c75e0523b45731cf45d1ec1c4d435f4c"
const jwt = require('jsonwebtoken')

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

// Pagination movie table
router.get('/getTop', authenticateJWT , async (req, res) => {
  // destructure page and limit and set default values
  const { page = 1, limit = 50 , sortBy = "-created_at" } = req.query;
  try {
    const query1 = { topick : true }
    // execute query with page and limit values
    const data = await Moviedata.find( query1 ,{ __v:0 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort(sortBy)
      .exec();

    // get total documents in the Posts collection 
    const count = await Moviedata.countDocuments(query1);

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

// Pagination movie table
router.get('/getgenre', authenticateJWT , async (req, res) => {
  // destructure page and limit and set default values
  const { page = 1, limit = 10 , sortBy = "created_at" , genre= ""} = req.query;
  try {
    const query1 = { genre : { $regex : genre } }
    // execute query with page and limit values
    const data = await Moviedata.find( query1 ,{__v:0 , created_at:0, topick:0 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort(sortBy)
      .exec();

    // get total documents in the Posts collection 
    const count = await Moviedata.countDocuments(query1);

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

// Pagination movie table
router.get('/getid', authenticateJWT , async (req, res) => {
  // destructure page and limit and set default values
  const { page = 1, limit = 10 , sortBy = "created_at" , id= ""} = req.query;
  try {
    const query1 = { _id : id }
    // execute query with page and limit values
    const data = await Moviedata.findOne( query1 ,{__v:0 , created_at:0, topick:0 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort(sortBy)
      .exec();

    // get total documents in the Posts collection 
    const count = await Moviedata.countDocuments(query1);

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


// Pagination movie table
// DONE
router.get('/search', authenticateJWT, async (req, res) => {
  // destructure page and limit and set default values
  const { page = 1, limit = 12 , sortBy = "created_at", title = ''} = req.query;
  try {
    const query1 = { title : { $regex : title } }
    // execute query with page and limit values
    const data = await Moviedata.find(query1,{__v:0 , created_at:0})
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort(sortBy)
      .exec();

    // get total documents in the Posts collection 
    const count = await Moviedata.countDocuments(query1);

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