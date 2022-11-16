const express = require('express');
const fileUpload = require('express-fileupload');
const router = express.Router()
const Model = require('../models/upload');
module.exports = router;

var now = new Date;
var utc_timestamp = Date.UTC(now.getUTCFullYear(),now.getUTCMonth(), now.getUTCDate() , 
      now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds(), now.getUTCMilliseconds());

//Post Method
router.post('/post', async (req, res) => {
    let sampleFile;
    let uploadPath;

    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send('No files were uploaded.');
    }

    sampleFile = req.files.sampleFile;
    uploadPath = __dirname + '/moviedata/' + sampleFile.name;
    
    const data = new Model({
        name: "filename",
        url: "url",
        created_at: utc_timestamp
    })
    
    try {
        const dataToSave = await data.save();
        sampleFile.mv(uploadPath, function(err) {
        if (err)
            return res.status(500).send(err);

        res.status(200).json(dataToSave)
    });
    }
    catch (error) {
        res.status(400).json({message: error.message})
    }
})

//Update by ID Method
router.patch('/update/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const updatedData = req.body;
        const options = { new: true };
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
router.delete('/delete/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const data = await Model.findByIdAndDelete(id)
        res.send(`Document with ${data.name} has been deleted..`)
    }
    catch (error) {
        res.status(400).json({ message: error.message })
    }
})

router.use(fileUpload());