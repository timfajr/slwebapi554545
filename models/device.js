const mongoose = require('mongoose');

const DeviceSchema = new mongoose.Schema({
    deviceid: {
        type: String
    },
    ownerid: {
        type: String
    },
    activeregion: [{
        regionurl: {
            type: String
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

module.exports = mongoose.model("devices", DeviceSchema)