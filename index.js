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

app.post('/get-probs', async (req, res) => {
    const teams_so_far = req.body.teams_so_far;
    let brackets_select = [];
    for (g in teams_so_far) {
        if (teams_so_far[g].trim().length===0) {
            continue;
        }
        brackets_select.push(`SELECT bracket FROM prediction_brackets
            WHERE GameName="${g}" AND Winner="${teams_so_far[g]}"
            `);
    }
    const bracket_select_statement = brackets_select.join(" INTERSECT ");
    const sql_statement = `
    SELECT Winner, CAST(COUNT(*) as REAL)/sum(COUNT(*)) OVER() pct FROM prediction_brackets 
    WHERE GameName="${req.body.probabilities_round}" AND bracket IN (${bracket_select_statement})
    GROUP BY Winner ORDER BY pct DESC;`
    console.log(sql_statement)
    let resp = await execute(db, sql_statement)
    console.log(resp);
    res.json({
        'probabilities_round': req.body.probabilities_round,
        'probabilities': resp
    });
});

app.listen(PORT, () => {
    console.log("Server Listening on PORT:", PORT);
  });



