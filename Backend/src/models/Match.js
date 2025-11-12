const mongoose = require('mongoose');
const { Schema } = mongoose;

const MatchSchema = new Schema(
  {
    homeTeam: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
    awayTeam: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
    scheduledAt: { type: Date, required: true },
    status: { type: String, enum: ['scheduled', 'completed'], default: 'scheduled' },
    score: {
      home: { type: Number, default: null },
      away: { type: Number, default: null }
    },
    round: { type: Number, default: 1 },
    bracketId: { type: String, default: 'main', index: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Match', MatchSchema);