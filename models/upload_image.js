const mongoose = require('mongoose');

const uploadSchema = new mongoose.Schema({
    name: {
        required: true,
        type: String
    },
    url: {
        required: true,
        type: String
    },
    created_at: {
        type: Date,
        default: Date.now,
    }
})

const UploadImage = mongoose.model("Imagefile", uploadSchema);

module.exports = { UploadImage };