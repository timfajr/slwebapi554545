const mongoose = require('mongoose');

const TopupSchema = new mongoose.Schema({
    roomid:{
        type: String
    },
    value: {
        type: String
    },
    status: {
        type: String
    },
    created_at: {
        type: Date,
        default: Date.now,
    }
})

module.exports = mongoose.model("Topup", TopupSchema);