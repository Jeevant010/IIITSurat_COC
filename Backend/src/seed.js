require('dotenv').config();
const mongoose = require('mongoose');
const Team = require('./models/Team');
const Match = require('./models/Match');

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/college_event');
    console.log('Connected');

    await Team.deleteMany({});
    await Match.deleteMany({});

    const teamNames = ['Alpha', 'Bravo', 'Charlie', 'Delta'];
    const teams = await Team.insertMany(teamNames.map((name, i) => ({ name, seed: i + 1 })));

    const now = new Date();
    const in1h = new Date(now.getTime() + 60 * 60 * 1000);

    const matches = await Match.insertMany([
      {
        homeTeam: teams[0]._id,
        awayTeam: teams[1]._id,
        scheduledAt: in1h,
        status: 'completed',
        score: { home: 2, away: 1 },
        round: 1,
        bracketId: 'main'
      },
      {
        homeTeam: teams[2]._id,
        awayTeam: teams[3]._id,
        scheduledAt: in1h,
        status: 'scheduled',
        round: 1,
        bracketId: 'main'
      }
    ]);

    console.log('Seeded', { teams: teams.length, matches: matches.length });
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();