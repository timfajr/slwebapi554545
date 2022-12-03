const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
    ownerid:{
        type: String
    },
    item: {
        type: String
    },
    quantity: {
        type: Number
    },
    price: {
        type: Number
    },
    total: {
        type: Number
    },
    gift:{
        type: Boolean,
        default: false
    },
    gift_ownerid:{
        type: String,
        default: ''
    },
    created_at: {
        type: Date,
        default: Date.now,
    }
})

module.exports = mongoose.model("Transaction", TransactionSchema);