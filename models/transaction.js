const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
    roomid:{
        type: String
    },
    item: {
        type: String
    },
    quantity: {
        type: String
    },
    price: {
        type: Number
    },
    total: {
        type: Number
    },
    created_at: {
        type: Date,
        default: Date.now,
    }
})

module.exports = mongoose.model("Transaction", TransactionSchema);