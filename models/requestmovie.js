const mongoose = require('mongoose');

const RequestmovieSchema = new mongoose.Schema({
    ownerid: {
        type: String
    },
    requestedmovie: {
        type: String
    },
    message: {
        type: String
    },
    created_at: {
        type: Date,
        default: Date.now,
    }
})

module.exports = mongoose.model("Requestmovie", RequestmovieSchema)