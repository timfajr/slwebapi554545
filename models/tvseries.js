const mongoose = require('mongoose');

const TvseriesSchema = new mongoose.Schema({
    title: {
        type: String
    },

    series: {
        type: Number
    },

    episode: {
        type: Number
    },

    // Generated from API
    url: {
        type: String
    },

    watched: {
        type: Number
    },

    identifier: {
        type: String
    },
    
    created_at: {
        type: Date,
        default: Date.now,
    }
})

module.exports = mongoose.model("Tvseriesdata", TvseriesSchema)