const express = require('express');
const router = express.Router()
const Moviedata = require('../models/moviedata');
module.exports = router;


// Pagination user table
router.get('/getall', async (req, res) => {
    // destructure page and limit and set default values
    const { page = 1, limit = 10 , sortBy = "created_at"} = req.query;
    try {
        
      // execute query with page and limit values
      const devices = await Moviedata.find({},{__v:0 , created_at:0, activeregion:0 , access_token:0 ,refresh_token:0 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort(sortBy)
        .exec();
  
      // get total documents in the Posts collection 
      const count = await Moviedata.countDocuments();
  
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
