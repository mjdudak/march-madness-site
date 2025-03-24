const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3');

const db = new sqlite3.Database('brackets.sqlite', sqlite3.OPEN_READONLY);

const app = express ();
app.use(express.json());

const PORT = process.env.PORT || 3000;

const execute = async (db, sql) => {
    return new Promise((resolve, reject) => {
        db.all(sql, (err, result) => {
            if (err) reject(err);
            resolve(result);
        });
    });
};

app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname, '/index.html'));
});

app.use(express.static('public'));
app.use(express.json());

app.get('/round-one-probs', async (req, res) => {
    const sqlStatement =   `SELECT 
    Winner,
    (CAST(COUNT(*) AS REAL) / SUM(COUNT(*)) OVER (PARTITION BY GameName)) AS pct
    FROM prediction_brackets
    WHERE Round=64
    GROUP BY GameName, Winner;`
    const resp = await execute(db, sqlStatement);
    res.json(resp);
});

app.post('/get-probs', async (req, res) => {
    const teamsSoFar = req.body.teamsSoFar;
    let bracketsSelect = [];
    for (g in teamsSoFar) {
        if (teamsSoFar[g].trim().length===0) {
            continue;
        }
        bracketsSelect.push(`${g}="${teamsSoFar[g]}"`);
    }
    const bracketSelectStatement = bracketsSelect.join(" AND ");
    const sqlStatement = `
    SELECT ${req.body.probabilitiesRound} as Winner, 
    COUNT(${req.body.probabilitiesRound}) as count, 
    CAST(COUNT(*) as REAL)/sum(COUNT(*)) OVER() pct 
    FROM prediction_brackets_wide
    WHERE ${bracketSelectStatement}
    GROUP BY ${req.body.probabilitiesRound} ORDER BY pct DESC;`
    let resp = await execute(db, sqlStatement);
    res.json({
        'probabilitiesRound': req.body.probabilitiesRound,
        'probabilities': resp
    });
});

app.get('/round-by-round-probs', async (req, res) => {
    const sqlStatement = `
    SELECT Winner, Round, 
    (CAST(COUNT(*) AS REAL))/(SELECT COUNT(DISTINCT bracket) FROM prediction_brackets) AS pct 
    FROM prediction_brackets 
    GROUP BY Winner, Round 
    ORDER BY Round ASC, pct DESC;`
    const resp = await execute(db, sqlStatement);
    res.json(resp);
})

app.listen(PORT, () => {
    console.log("Server Listening on PORT:", PORT);
  });



