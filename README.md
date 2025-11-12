# IIITSurat_COC


Features:
- Public
  - Teams page: list all teams
  - Schedule page: all matches (scheduled and completed)
  - Leaderboard: computed from match results (Win=3, Draw=1, Loss=0)
  - Bracket: grouped by rounds (supports single-elimination via admin generation)
- Admin (simple password auth via header)
  - Create/update/delete teams
  - Create/update/delete matches (scores, status, schedule)
  - Generate initial bracket round from a list of team IDs

Stack:
- Backend: Node.js, Express, MongoDB (Mongoose)
- Frontend: React + Vite
- Auth: shared admin password in header `x-admin-password`

## Quickstart

1) Backend
- Copy `backend/.env.example` to `backend/.env` and set values
- Install and run:
  ```
  cd backend
  npm install
  npm run dev
  ```
- Default: http://localhost:4000

2) Frontend
- Set `VITE_API_URL` in `frontend/.env` (e.g., `http://localhost:4000/api`)
- Install and run:
  ```
  cd frontend
  npm install
  npm run dev
  ```
- Default: http://localhost:5173

3) Admin
- Open the Admin page in the frontend to enter your admin password (stored in localStorage)
- All admin actions send the header `x-admin-password: <your_password>`

## API Overview

Public:
- GET /api/teams
- GET /api/schedule
- GET /api/leaderboard
- GET /api/bracket?bracketId=main

Admin (requires header x-admin-password):
- POST /api/teams { name }
- PUT /api/teams/:id { name? }
- DELETE /api/teams/:id
- POST /api/matches { homeTeam, awayTeam, scheduledAt, round?, bracketId? }
- PUT /api/matches/:id { homeTeam?, awayTeam?, scheduledAt?, round?, bracketId?, status?, score? }
- DELETE /api/matches/:id
- POST /api/bracket/generate { bracketId, teamIds: [ObjectId, ...] }

Notes:
- Leaderboard scoring: Win=3, Draw=1, Loss=0
- Bracket endpoint groups matches by `round` for a `bracketId` (default: `main`)
