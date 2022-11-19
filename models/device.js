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
        type: String
    }
})

const Device = mongoose.model("devices", DeviceSchema);

module.exports = { Device };