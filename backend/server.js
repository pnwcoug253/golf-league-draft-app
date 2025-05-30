const express = require('express');
const cors = require('cors');
const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Database setup
const db = new sqlite3.Database('golf_league.db');

// Initialize database tables
db.serialize(() => {
  // Tournaments table
  db.run(`CREATE TABLE IF NOT EXISTS tournaments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    year INTEGER NOT NULL,
    status TEXT DEFAULT 'upcoming',
    start_date TEXT,
    end_date TEXT,
    course TEXT,
    purse TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Players table
  db.run(`CREATE TABLE IF NOT EXISTS players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    tournament_id INTEGER,
    drafted_by TEXT,
    total_score INTEGER DEFAULT 0,
    to_par INTEGER DEFAULT 0,
    position TEXT,
    round1_score INTEGER DEFAULT NULL,
    round2_score INTEGER DEFAULT NULL,
    round3_score INTEGER DEFAULT NULL,
    round4_score INTEGER DEFAULT NULL,
    world_rank INTEGER,
    country TEXT,
    FOREIGN KEY (tournament_id) REFERENCES tournaments (id)
  )`);

  // Draft picks table
  db.run(`CREATE TABLE IF NOT EXISTS draft_picks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tournament_id INTEGER,
    player_name TEXT NOT NULL,
    drafted_by TEXT NOT NULL,
    pick_order INTEGER,
    round INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tournament_id) REFERENCES tournaments (id)
  )`);

  // League settings table
  db.run(`CREATE TABLE IF NOT EXISTS league_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    players_per_team INTEGER DEFAULT 10,
    current_round INTEGER DEFAULT 1,
    draft_complete BOOLEAN DEFAULT 0,
    tournament_id INTEGER,
    FOREIGN KEY (tournament_id) REFERENCES tournaments (id)
  )`);
});

// Enhanced mock data with more realistic tournament field
const mockTournamentField = [
  { name: "Scottie Scheffler", worldRank: 1, country: "USA" },
  { name: "Jon Rahm", worldRank: 2, country: "ESP" },
  { name: "Rory McIlroy", worldRank: 3, country: "NIR" },
  { name: "Viktor Hovland", worldRank: 4, country: "NOR" },
  { name: "Patrick Cantlay", worldRank: 5, country: "USA" },
  { name: "Xander Schauffele", worldRank: 6, country: "USA" },
  { name: "Collin Morikawa", worldRank: 7, country: "USA" },
  { name: "Wyndham Clark", worldRank: 8, country: "USA" },
  { name: "Ludvig Aberg", worldRank: 9, country: "SWE" },
  { name: "Max Homa", worldRank: 10, country: "USA" },
  { name: "Tony Finau", worldRank: 11, country: "USA" },
  { name: "Jordan Spieth", worldRank: 12, country: "USA" },
  { name: "Justin Thomas", worldRank: 13, country: "USA" },
  { name: "Russell Henley", worldRank: 14, country: "USA" },
  { name: "Brian Harman", worldRank: 15, country: "USA" },
  { name: "Jason Day", worldRank: 16, country: "AUS" },
  { name: "Sam Burns", worldRank: 17, country: "USA" },
  { name: "Cameron Young", worldRank: 18, country: "USA" },
  { name: "Tommy Fleetwood", worldRank: 19, country: "ENG" },
  { name: "Hideki Matsuyama", worldRank: 20, country: "JPN" },
  { name: "Keegan Bradley", worldRank: 21, country: "USA" },
  { name: "Adam Scott", worldRank: 22, country: "AUS" },
  { name: "Sahith Theegala", worldRank: 23, country: "USA" },
  { name: "Shane Lowry", worldRank: 24, country: "IRL" },
  { name: "Will Zalatoris", worldRank: 25, country: "USA" },
  { name: "Tyrrell Hatton", worldRank: 26, country: "ENG" },
  { name: "Corey Conners", worldRank: 27, country: "CAN" },
  { name: "Si Woo Kim", worldRank: 28, country: "KOR" },
  { name: "Taylor Pendrith", worldRank: 29, country: "CAN" },
  { name: "Matt Fitzpatrick", worldRank: 30, country: "ENG" },
  { name: "Sungjae Im", worldRank: 31, country: "KOR" },
  { name: "Denny McCarthy", worldRank: 32, country: "USA" },
  { name: "Tom Kim", worldRank: 33, country: "KOR" },
  { name: "Chris Kirk", worldRank: 34, country: "USA" },
  { name: "Billy Horschel", worldRank: 35, country: "USA" },
  { name: "Nick Taylor", worldRank: 36, country: "CAN" },
  { name: "Jake Knapp", worldRank: 37, country: "USA" },
  { name: "Austin Eckroat", worldRank: 38, country: "USA" },
  { name: "Akshay Bhatia", worldRank: 39, country: "USA" },
  { name: "Davis Thompson", worldRank: 40, country: "USA" },
  { name: "Rickie Fowler", worldRank: 41, country: "USA" },
  { name: "Gary Woodland", worldRank: 42, country: "USA" },
  { name: "Cameron Smith", worldRank: 43, country: "AUS" },
  { name: "Min Woo Lee", worldRank: 44, country: "AUS" },
  { name: "Lucas Glover", worldRank: 45, country: "USA" },
  { name: "Emiliano Grillo", worldRank: 46, country: "ARG" },
  { name: "Ryan Fox", worldRank: 47, country: "NZL" },
  { name: "Sepp Straka", worldRank: 48, country: "AUT" },
  { name: "Abraham Ancer", worldRank: 49, country: "MEX" },
  { name: "Harris English", worldRank: 50, country: "USA" },
  { name: "Kurt Kitayama", worldRank: 51, country: "USA" },
  { name: "Kevin Kisner", worldRank: 52, country: "USA" },
  { name: "Andrew Putnam", worldRank: 53, country: "USA" },
  { name: "J.T. Poston", worldRank: 54, country: "USA" },
  { name: "Eric Cole", worldRank: 55, country: "USA" },
  { name: "Alex Noren", worldRank: 56, country: "SWE" },
  { name: "Vincent Norrman", worldRank: 57, country: "SWE" },
  { name: "Ben Griffin", worldRank: 58, country: "USA" },
  { name: "Neal Shipley", worldRank: 59, country: "USA" },
  { name: "Matt McCarty", worldRank: 60, country: "USA" }
];

// API Routes

// Get current tournament info
app.get('/api/tournament/current', (req, res) => {
  db.get(
    'SELECT * FROM tournaments WHERE status = "active" ORDER BY created_at DESC LIMIT 1',
    (err, tournament) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      if (!tournament) {
        // Create current tournament if none exists
        const tournamentData = {
          name: "The Memorial Tournament presented by Workday",
          year: new Date().getFullYear(),
          status: 'active',
          start_date: '2025-06-05',
          end_date: '2025-06-08',
          course: 'Muirfield Village Golf Club',
          purse: '$20,000,000'
        };
        
        db.run(
          'INSERT INTO tournaments (name, year, status, start_date, end_date, course, purse) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [tournamentData.name, tournamentData.year, tournamentData.status, tournamentData.start_date, tournamentData.end_date, tournamentData.course, tournamentData.purse],
          function(err) {
            if (err) {
              return res.status(500).json({ error: err.message });
            }
            
            // Initialize league settings
            db.run(
              'INSERT INTO league_settings (tournament_id, players_per_team, current_round, draft_complete) VALUES (?, ?, ?, ?)',
              [this.lastID, 10, 1, 0]
            );
            
            res.json({
              id: this.lastID,
              ...tournamentData
            });
          }
        );
      } else {
        res.json(tournament);
      }
    }
  );
});

// Get tournament field
app.get('/api/tournament/:id/field', (req, res) => {
  const tournamentId = req.params.id;
  
  db.all(
    'SELECT * FROM players WHERE tournament_id = ? ORDER BY world_rank ASC',
    [tournamentId],
    (err, players) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      if (players.length === 0) {
        // Initialize with mock data if no players exist
        const stmt = db.prepare('INSERT INTO players (name, tournament_id, total_score, to_par, world_rank, country) VALUES (?, ?, ?, ?, ?, ?)');
        
        mockTournamentField.forEach(player => {
          stmt.run([player.name, tournamentId, 0, 0, player.worldRank, player.country]);
        });
        
        stmt.finalize((err) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          
          // Return all players after initialization
          db.all(
            'SELECT * FROM players WHERE tournament_id = ? ORDER BY world_rank ASC',
            [tournamentId],
            (err, players) => {
              if (err) {
                return res.status(500).json({ error: err.message });
              }
              res.json(players);
            }
          );
        });
      } else {
        res.json(players);
      }
    }
  );
});

// Get available players for draft
app.get('/api/tournament/:id/available-players', (req, res) => {
  const tournamentId = req.params.id;
  
  db.all(
    'SELECT * FROM players WHERE tournament_id = ? AND drafted_by IS NULL ORDER BY world_rank ASC',
    [tournamentId],
    (err, players) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(players);
    }
  );
});

// Draft a player
app.post('/api/draft', (req, res) => {
  const { tournamentId, playerId, draftedBy } = req.body;
  
  db.get('SELECT COUNT(*) as count FROM draft_picks WHERE tournament_id = ?', [tournamentId], (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    const pickOrder = result.count + 1;
    const round = Math.ceil(pickOrder / 4); // 4 drafters
    
    // First, get the player name
    db.get('SELECT name FROM players WHERE id = ?', [playerId], (err, player) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      if (!player) {
        return res.status(404).json({ error: 'Player not found' });
      }
      
      // Update the player's drafted_by status
      db.run(
        'UPDATE players SET drafted_by = ? WHERE id = ? AND drafted_by IS NULL',
        [draftedBy, playerId],
        function(err) {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          
          if (this.changes === 0) {
            return res.status(400).json({ error: 'Player not available for draft' });
          }
          
          // Record the draft pick
          db.run(
            'INSERT INTO draft_picks (tournament_id, player_name, drafted_by, pick_order, round) VALUES (?, ?, ?, ?, ?)',
            [tournamentId, player.name, draftedBy, pickOrder, round],
            function(err) {
              if (err) {
                return res.status(500).json({ error: err.message });
              }
              
              res.json({ 
                success: true, 
                message: `${player.name} drafted by ${draftedBy}`,
                pickOrder: pickOrder,
                round: round
              });
            }
          );
        }
      );
    });
  });
});

// Get draft results
app.get('/api/tournament/:id/draft', (req, res) => {
  const tournamentId = req.params.id;
  
  db.all(
    'SELECT * FROM draft_picks WHERE tournament_id = ? ORDER BY pick_order',
    [tournamentId],
    (err, picks) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(picks);
    }
  );
});

// Get league settings
app.get('/api/tournament/:id/settings', (req, res) => {
  const tournamentId = req.params.id;
  
  db.get(
    'SELECT * FROM league_settings WHERE tournament_id = ?',
    [tournamentId],
    (err, settings) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      if (!settings) {
        // Create default settings
        db.run(
          'INSERT INTO league_settings (tournament_id, players_per_team, current_round, draft_complete) VALUES (?, ?, ?, ?)',
          [tournamentId, 10, 1, 0],
          function(err) {
            if (err) {
              return res.status(500).json({ error: err.message });
            }
            
            res.json({
              id: this.lastID,
              tournament_id: tournamentId,
              players_per_team: 10,
              current_round: 1,
              draft_complete: 0
            });
          }
        );
      } else {
        res.json(settings);
      }
    }
  );
});

// Get team rosters
app.get('/api/tournament/:id/teams', (req, res) => {
  const tournamentId = req.params.id;
  
  db.all(
    'SELECT * FROM players WHERE tournament_id = ? AND drafted_by IS NOT NULL ORDER BY drafted_by, world_rank',
    [tournamentId],
    (err, players) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      // Group players by team
      const teams = players.reduce((acc, player) => {
        if (!acc[player.drafted_by]) {
          acc[player.drafted_by] = [];
        }
        acc[player.drafted_by].push(player);
        return acc;
      }, {});
      
      res.json(teams);
    }
  );
});

// Update player scores (mock endpoint - in real app would fetch from API)
app.post('/api/players/:id/score', (req, res) => {
  const playerId = req.params.id;
  const { round1Score, round2Score, round3Score, round4Score, toPar, position } = req.body;
  
  // Calculate total score
  const scores = [round1Score, round2Score, round3Score, round4Score].filter(s => s !== null && s !== undefined);
  const totalScore = scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) : 0;
  
  db.run(
    'UPDATE players SET round1_score = ?, round2_score = ?, round3_score = ?, round4_score = ?, total_score = ?, to_par = ?, position = ? WHERE id = ?',
    [round1Score, round2Score, round3Score, round4Score, totalScore, toPar, position, playerId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Player not found' });
      }
      
      res.json({ success: true, message: 'Score updated' });
    }
  );
});

// Simulate live scoring updates (for demo purposes)
app.post('/api/tournament/:id/simulate-scores', (req, res) => {
  const tournamentId = req.params.id;
  
  db.all('SELECT * FROM players WHERE tournament_id = ?', [tournamentId], (err, players) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    const stmt = db.prepare('UPDATE players SET round1_score = ?, to_par = ?, total_score = ?, position = ? WHERE id = ?');
    
    players.forEach((player, index) => {
      // Generate random first round scores (68-76)
      const round1 = Math.floor(Math.random() * 9) + 68;
      const toPar = round1 - 72;
      const position = index < 10 ? `T${index + 1}` : `T${Math.floor(Math.random() * 20) + 11}`;
      
      stmt.run([round1, toPar, round1, position, player.id]);
    });
    
    stmt.finalize((err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ success: true, message: 'Scores simulated' });
    });
  });
});

// Reset tournament (for testing)
app.post('/api/tournament/:id/reset', (req, res) => {
  const tournamentId = req.params.id;
  
  db.serialize(() => {
    db.run('DELETE FROM draft_picks WHERE tournament_id = ?', [tournamentId]);
    db.run('UPDATE players SET drafted_by = NULL, total_score = 0, to_par = 0, position = NULL, round1_score = NULL, round2_score = NULL, round3_score = NULL, round4_score = NULL WHERE tournament_id = ?', [tournamentId]);
    db.run('UPDATE league_settings SET draft_complete = 0, current_round = 1 WHERE tournament_id = ?', [tournamentId], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ success: true, message: 'Tournament reset successfully' });
    });
  });
});

app.listen(PORT, () => {
  console.log(`🏌️ Golf League API running on port ${PORT}`);
  console.log(`📊 Dashboard available at http://localhost:3000`);
});