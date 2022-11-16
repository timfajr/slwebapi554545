const express = require('express');
const router = express.Router()
const { Movie } = require('../models/movie');
module.exports = router;


router.get('/getAll', async (req, res) => {
    try{
        const data = await Movie.find();
        res.json(data)
    }
    catch(error){
        res.status(500).json({message: error.message})
    }
})
