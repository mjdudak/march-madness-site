gameRelationships = {
    'E9': ['E1', 'E2'],
    'E10': ['E3', 'E4'],
    'E11': ['E5', 'E6'],
    'E12': ['E7', 'E8'],
    'E13': ['E9', 'E10'],
    'E14': ['E11', 'E12'],
    'E15': ['E13', 'E14'],
    'W9': ['W1', 'W2'],
    'W10': ['W3', 'W4'],
    'W11': ['W5', 'W6'],
    'W12': ['W7', 'W8'],
    'W13': ['W9', 'W10'],
    'W14': ['W11', 'W12'],
    'W15': ['W13', 'W14'],
    'M9': ['M1', 'M2'],
    'M10': ['M3', 'M4'],
    'M11': ['M5', 'M6'],
    'M12': ['M7', 'M8'],
    'M13': ['M9', 'M10'],
    'M14': ['M11', 'M12'],
    'M15': ['M13', 'M14'],
    'S9': ['S1', 'S2'],
    'S10': ['S3', 'S4'],
    'S11': ['S5', 'S6'],
    'S12': ['S7', 'S8'],
    'S13': ['S9', 'S10'],
    'S14': ['S11', 'S12'],
    'S15': ['S13', 'S14'],
    'F1': ['E15', 'W15'],
    'F2': ['M15', 'S15'],
    'F3': ['F1', 'F2']
}

function getTeams(matchup) {
    let teams = {}
    let gamesToCheck = gameRelationships[matchup]
    if (gamesToCheck === undefined) {
        return {}
    }
    for (g of gamesToCheck) {
        let team = document.getElementById("winner-" + g).childNodes[0].textContent;
        if (team != "") {
            teams[g] = team
        }
        else {
            Object.assign(teams, getTeams(g))
        }
    }
    return teams
}

function getGamesUpstream(matchup) {
    let newGame = Object.entries(gameRelationships).map((el) => {
        if (el[1].includes(matchup)) {
            const winnerElement = document.getElementById("winner-"+matchup).textContent;
            if (winnerElement.trim().length>0){
                return el[0];
            }
            return el[0];
        }
    }).find((el) => (el!=undefined));
    if (newGame!=undefined) {
        let gamesToCheck = [newGame];
        const addGames = getGamesUpstream(newGame);
        gamesToCheck = gamesToCheck.concat(addGames);
        return gamesToCheck;
    }
    else {
        return []
    }
    
}


const redoProbabilities = function(bodyResponse) {
    const matchup = document.getElementById(bodyResponse.probabilitiesRound);
    for (t of matchup.getElementsByClassName("team")) {
        const thisTeam = bodyResponse.probabilities.filter((el) => {
            return el['Winner']==t.childNodes[0].textContent;
        });
        if (thisTeam.length>0){
            const prob = thisTeam[0].pct;
            t.getElementsByClassName("score")[0].textContent = `${(prob*100).toPrecision(2)}%`;
        }
    }
}

const changeProbabilities = async function(teamsSoFar, probabilitiesRound) {
    let jsonBody = {
        'probabilitiesRound': probabilitiesRound,
        'teamsSoFar': teamsSoFar
    }
    const response = await fetch("http://localhost:3000/get-probs", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(jsonBody)
    });
    const bodyResponse = await response.json();
    redoProbabilities(bodyResponse);
}

const advanceTeam = async function(target) {
    const thisTeam = target.childNodes[0].textContent;
    const matchupId = target.parentNode.id;
    const gameNumber = parseInt(matchupId.substring(1));
    const toMoveInto = document.getElementById("winner-" + matchupId)
    if (toMoveInto.textContent.trim()!="" && toMoveInto.childNodes[0].textContent != thisTeam) {
        const otherTeam = [...target.parentNode.childNodes].find((el) => {
            if (el.childNodes.length > 0) {
                return el.childNodes[0].textContent != thisTeam;
            }
            return false;
        }).childNodes[0].textContent;
        [...document.getElementsByClassName("team-set")].forEach((el) => {
            if (el.childNodes[0].textContent == otherTeam) {
                const testGame = el.parentNode.id;
                let testGameNum = parseInt(el.parentNode.id.substring(1));
                if (testGame.substring(0,1)=="F") {
                    testGameNum = testGameNum + 15;
                }
                if (testGameNum > gameNumber) {
                    el.childNodes[0].textContent = "";
                    el.childNodes[1].textContent = "";
                    el.classList.remove('team-set', 'picked');
                }
            }
        })
    }
    toMoveInto.childNodes[0].textContent = thisTeam;
    for (child of target.parentNode.querySelectorAll('li.team')) {
        child.classList.remove('picked');
    }
    target.classList.add('picked');
    toMoveInto.classList.add('team-set');
    let probabilitiesRound = toMoveInto.parentNode.id
    let teamsSoFar = getTeams(probabilitiesRound)
    changeProbabilities(teamsSoFar, probabilitiesRound, thisTeam);
    const upstreamGames = getGamesUpstream(probabilitiesRound);
    upstreamGames.forEach((match) => {
        teamsSoFar = getTeams(match);
        changeProbabilities(teamsSoFar, match);
    });
}

const bubbleUpClick = async function(ev) {
    if (ev.target.tagName=="LI") {
        await advanceTeam(ev.target);
    }
    else {
        await advanceTeam(ev.target.parentNode);
    }
}

for (t of document.querySelectorAll(".team")) {
    t.addEventListener("click", (ev) => bubbleUpClick(ev))
}

const loadRoundOne = async function() {
    const response = await fetch("http://localhost:3000/round-one-probs");
    const bodyResponse = await response.json();
    const roundOneTeams = document.getElementsByClassName("team");
    [...roundOneTeams].forEach((el) => {
        const teamName = el.childNodes[0].textContent;
        if (teamName.trim().length != 0) {
            const prob = bodyResponse.find((el) => el.Winner==teamName).pct;
            el.childNodes[1].textContent = `${(prob*100).toPrecision(2)}%`
        }
    })
}

loadRoundOne()