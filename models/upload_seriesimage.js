const mongoose = require('mongoose');

const uploadseriesSchema = new mongoose.Schema({
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

const UploadSeriesImage = mongoose.model("Imageseriesfile", uploadseriesSchema);

module.exports = { UploadSeriesImage };