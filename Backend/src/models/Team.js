const mongoose = require('mongoose');
const { Schema } = mongoose;

// Member (player) per your request; no hero levels
const MemberSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    playerTag: { type: String, default: '' },   // e.g., #ABC123
    email: { type: String, default: '' },
    townHall: { type: Number, default: null },
    role: { type: String, enum: ['Leader', 'Co-Leader', 'Elder', 'Member', ''], default: '' },
    stats: {
      attacks: { type: Number, default: 0 },
      triples: { type: Number, default: 0 },
      stars: { type: Number, default: 0 },
      avgStars: { type: Number, default: 0 },
      avgDestruction: { type: Number, default: 0 },
      // allow adding more stats later without schema changes
      extra: { type: Map, of: Number, default: undefined }
    }
  },
  { _id: true }
);

const TeamSchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    clanTag: { type: String, default: '' },
    level: { type: Number, default: null },
    warLeague: { type: String, default: '' },
    leader: { type: String, default: '' },
    logoUrl: { type: String, default: '' },
    about: { type: String, default: '' },
    group: { type: String, default: null }, // group code for group stage tables (optional)
    seed: { type: Number, default: null },

    members: { type: [MemberSchema], default: [] },

    // legacy back-compat field (if older docs still hold "players")
    players: { type: Array, default: undefined }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Team', TeamSchema);