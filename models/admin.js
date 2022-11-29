const mongoose = require('mongoose');

const dataSchema = new mongoose.Schema({
    username: {
        required: true,
        type: String
    },
    password: {
        required: true,
        type: String
    },
    refresh_token: {
        type: String
    }
})

module.exports = mongoose.model('Admin', dataSchema)