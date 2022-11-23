const mongoose = require('mongoose');

const DeviceSchema = new mongoose.Schema({
    deviceid: {
        required: true,
        type: String
    },
    ownerid: {
        required: true,
        type: String
    },
    activeregion: [{
        regionurl: {
            type: String,
            required: true
        },
        login_date: {
            type: Date
        }
    }],
    access_token :{
        type: String
    },
    refresh_token :{
        type: String
    },
    created_at: {
        type: Date
    },
    purchased_movie: [{
        movie_title: {
            type: String
        },
        movie_description: {
            type: String
        },
        purchased_at: {
            type: Date
        }
    }],
    transaction: [{
        item: {
            type: String
        },
        price: {
            type: String
        },
        transaction_at: {
            type: Date
        }
    }]
})

const Device = mongoose.model("devices", DeviceSchema);

module.exports = { Device };