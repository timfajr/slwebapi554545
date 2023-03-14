const mongoose = require('mongoose');

const TvseriestitleSchema = new mongoose.Schema({

    title: {
        type: String
    },

    description: {
        type: String
    },

    genre: {
        type: String
    },

    series: [{
        title: {
            type: String
        },
        series: {
            type: Number
        },
        identifier: {
            type: String
        },
        episode: {
            type: Number
        },
        url: {
            type: String
        },
    }],

    // Bool
    topick: {
        type: Boolean
    },

    // Generated from API
    imgurl: {
        type: String
    },

    identifier: {
        type: String
    },
    
    created_at: {
        type: Date,
        default: Date.now,
    }
})

module.exports = mongoose.model("Tvseriestitledata", TvseriestitleSchema)