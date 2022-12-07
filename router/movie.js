const express = require('express');
const router = express.Router()
const Moviedata = require('../models/moviedata');
module.exports = router;

// Pagination movie table
router.get('/getAll', async (req, res) => {
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
router.get('/getgenre', async (req, res) => {
  // destructure page and limit and set default values
  const { page = 1, limit = 10 , sortBy = "created_at" , genre= ""} = req.query;
  try {
    const query1 = { genre : { $regex : genre } }
    // execute query with page and limit values
    const data = await Moviedata.find( query1 ,{__v:0 , created_at:0, _id:0, topick:0 })
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
router.get('/getid', async (req, res) => {
  // destructure page and limit and set default values
  const { page = 1, limit = 10 , sortBy = "created_at" , id= ""} = req.query;
  try {
    const query1 = { id : { $regex : id } }
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
router.get('/search', async (req, res) => {
  // destructure page and limit and set default values
  const { page = 1, limit = 12 , sortBy = "created_at", title = ''} = req.query;
  try {
    const query1 = { title : { $regex : title } }
    // execute query with page and limit values
    const data = await Moviedata.find(query1,{__v:0 , created_at:0, _id:0})
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