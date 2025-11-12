const mongoose = require('mongoose');
const { Schema } = mongoose;

const SideResultSchema = new Schema(
  {
    stars: { type: Number, default: 0 },         // total stars
    destruction: { type: Number, default: 0 },   // 0..100
    attacksUsed: { type: Number, default: 0 }
  },
  { _id: false }
);

const MatchSchema = new Schema(
  {
    homeTeam: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
    awayTeam: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
    scheduledAt: { type: Date, required: true },
    status: { type: String, enum: ['scheduled', 'in-progress', 'completed'], default: 'scheduled' },
    warType: { type: String, enum: ['friendly', 'regular', 'cwl'], default: 'regular' },
    size: { type: Number, enum: [5, 10, 15, 20, 30, 50], default: 15 },
    attacksPerMember: { type: Number, enum: [1, 2], default: 2 },
    result: {
      home: { type: SideResultSchema, default: () => ({}) },
      away: { type: SideResultSchema, default: () => ({}) }
    },
    round: { type: Number, default: 1 },
    bracketId: { type: String, default: 'main', index: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Match', MatchSchema);