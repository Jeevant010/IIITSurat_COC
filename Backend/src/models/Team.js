const mongoose = require('mongoose');

const TeamSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    group: { type: String, default: null }, // optional
    seed: { type: Number, default: null }   // optional
  },
  { timestamps: true }
);

module.exports = mongoose.model('Team', TeamSchema);