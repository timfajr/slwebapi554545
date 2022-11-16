// @/models.js
const mongoose = require("mongoose");

const DogSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  }
});

const Dog = mongoose.model("Dog", DogSchema);

module.exports = { Dog };