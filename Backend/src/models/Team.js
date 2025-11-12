const mongoose = require('mongoose');
const { Schema } = mongoose;

const MemberSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    role: { type: String, enum: ['Leader', 'Co-Leader', 'Elder', 'Member', ''], default: '' },
    thLevel: { type: Number, default: null },
    heroes: {
      bk: { type: Number, default: 0 }, // Barbarian King
      aq: { type: Number, default: 0 }, // Archer Queen
      gw: { type: Number, default: 0 }, // Grand Warden
      rc: { type: Number, default: 0 }  // Royal Champion
    },
    stats: {
      attacks: { type: Number, default: 0 },
      triples: { type: Number, default: 0 },
      stars: { type: Number, default: 0 },
      avgStars: { type: Number, default: 0 },
      avgDestruction: { type: Number, default: 0 }
    }
  },
  { _id: true }
);

const TeamSchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    clanTag: { type: String, default: '' }, // e.g., #ABC123
    level: { type: Number, default: null }, // clan level
    warLeague: { type: String, default: '' },
    leader: { type: String, default: '' },
    logoUrl: { type: String, default: '' }, // clan badge
    about: { type: String, default: '' },
    group: { type: String, default: null },
    seed: { type: Number, default: null },
    members: { type: [MemberSchema], default: [] }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Team', TeamSchema);