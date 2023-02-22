const mongoose = require('mongoose');

const DeviceSchema = new mongoose.Schema({

    ownerid: {
        type: String
    },

    username: {
        type: String
    },

    // API Generated
    subscription: {
        type: String
    },

    devices: [{
        deviceid: {
            type : String
        },
        activeregion: [{
            regionurl: {
                type: String
            },
            login_date: {
                type: Date
            }
        }],
    }],

    transaction: [{
        ownerid: {
            type : String
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
    }],

    refreshtoken: {
        type: String
    },

    expires: {
        type: Date
    },

    timeleft: {
        type: Number
    },

    total_watch: {
        type: Number
    },

    balance: {
        type: Number
    },

    secret:{
        type: String
    },

    created_at: {
        type: Date
    },
})

module.exports = mongoose.model("devices", DeviceSchema)