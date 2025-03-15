game_relationships = {
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
    let games_to_check = game_relationships[matchup]
    if (games_to_check === undefined) {
        return {}
    }
    for (g of games_to_check) {
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

const redo_probabilities = function(body_response) {
    const matchup = document.getElementById(body_response.probabilities_round);
    for (t of matchup.getElementsByClassName("team")) {
        const this_team = body_response.probabilities.filter((el) => {
            return el['Winner']==t.childNodes[0].textContent;
        });
        if (this_team.length>0){
            const prob = this_team[0].pct;
            t.getElementsByClassName("score")[0].textContent = `${(prob*100).toPrecision(2)}%`;
        }
    }
}


const advanceTeam = async function(target) {
    const this_team = target.childNodes[0].textContent;
    const matchup_id = target.parentNode.id;
    const game_number = parseInt(matchup_id.substring(1));
    const to_move_into = document.getElementById("winner-" + matchup_id)
    if (to_move_into.textContent.trim()!="" && to_move_into.childNodes[0].textContent != this_team) {
        const other_team = [...target.parentNode.childNodes].filter((el) => {
            if (el.childNodes.length > 0) {
                return el.childNodes[0].textContent != this_team;
            }
            return false;
        })[0].childNodes[0].textContent;
        [...document.getElementsByClassName("team-set")].forEach((el) => {
            if (el.childNodes[0].textContent == other_team) {
                const test_game = el.parentNode.id;
                let test_game_num = parseInt(el.parentNode.id.substring(1));
                if (test_game.substring(0,1)=="F") {
                    test_game_num = test_game_num + 15;
                }
                if (test_game_num > game_number) {
                    el.childNodes[0].textContent = "";
                    el.childNodes[1].textContent = "";
                    el.classList.remove('team-set', 'picked');
                }
            }
        })
    }
    to_move_into.childNodes[0].textContent = this_team
    for (child of target.parentNode.querySelectorAll('li.team')) {
        child.classList.remove('picked')
    }
    target.classList.add('picked')
    to_move_into.classList.add('team-set')
    let probabilities_round = to_move_into.parentNode.id
    let teams_so_far = getTeams(probabilities_round)
    let json_body = {
        'this_team': this_team,
        'probabilities_round': probabilities_round,
        'teams_so_far': teams_so_far
    }
    const response = await fetch("http://localhost:3000/get-probs", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(json_body)
    })
    const body_response = await response.json();
    redo_probabilities(body_response);
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