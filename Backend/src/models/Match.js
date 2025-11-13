const mongoose = require('mongoose');
const { Schema } = mongoose;

const SideResultSchema = new Schema(
  {
    stars: { type: Number, default: 0 },
    destruction: { type: Number, default: 0 }, // 0..100
    attacksUsed: { type: Number, default: 0 }
  },
  { _id: false }
);

// Tournament stages per your format
const STAGES = ['group', 'eliminator', 'quarterfinal', 'semifinal', 'final'];

// War types (normal CoC + esports + legend)
const WAR_TYPES = ['regular', 'friendly', 'cwl', 'esports', 'legend'];

// IMPORTANT: allow both status naming schemes used in your UI
const STATUSES = ['scheduled', 'preparation', 'in-progress', 'battle', 'completed'];

const MatchSchema = new Schema(
  {
    homeTeam: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
    awayTeam: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
    scheduledAt: { type: Date, required: true },
    status: { type: String, enum: STATUSES, default: 'scheduled', index: true },

    stage: { type: String, enum: STAGES, default: 'group', index: true },

    warType: { type: String, enum: WAR_TYPES, default: 'regular' },
    size: { type: Number, enum: [5, 10, 15, 20, 30, 50], default: 15 },
    attacksPerMember: { type: Number, enum: [1, 2], default: 2 },

    result: {
      home: { type: SideResultSchema, default: () => ({}) },
      away: { type: SideResultSchema, default: () => ({}) }
    },

    // ordering for brackets
    round: { type: Number, default: 1, index: true },
    bracketId: { type: String, default: 'main', index: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Match', MatchSchema);