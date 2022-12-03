const mongoose = require('mongoose');

const MovieSchema = new mongoose.Schema({
    title: {
        type: String
    },
    description: {
        type: String
    },
    genre: {
        type: String
    },

    // Bool
    topick: {
        type: Boolean
    },

    // Generated from API
    url: {
        type: String
    },
    imgurl: {
        type: String
    },
    watched: {
        type: Number
    },
    created_at: {
        type: Date,
        default: Date.now,
    }
})

module.exports = mongoose.model("Moviedata", MovieSchema)