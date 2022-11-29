const mongoose = require('mongoose');

const MovieSchema = new mongoose.Schema({
    title: {
        type: String
    },
    description: {
        type: String
    },
    price: {
        type: Number
    },
    genre: {
        type: String
    },
    genre: {
        type: String
    },
    discount: {
        type: Number
    },
    rentprice: {
        type: Number
    },
    discounted: {
        type: Boolean
    },
    topick: {
        type: Boolean
    },
    published: {
        type: Boolean
    },
    url: {
        type: String
    },
    purchased: {
        type: Number
    },
    created_at: {
        type: Date,
        default: Date.now,
    }
})

module.exports = mongoose.model("Moviedata", MovieSchema)