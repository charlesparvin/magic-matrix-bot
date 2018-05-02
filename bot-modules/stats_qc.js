var config = require('../matrix-bot-config').base;
var sqlite3 = require('sqlite3').verbose();
var q = require('q');
var db = new sqlite3.Database(config.sqliteDatabase);

exports.runQuery = function(client, query, querySender, queryRoom) {
    var params, line;
  
    var regex = /^add \d{1}$/;

    if(query == "" || query == undefined) {
        console.log("Pulling stats for " + querySender);

        var runs = 0;
        var goldspent = 0;
        var goldwon = 0;
        var c_rare = 0;
        var c_unco = 0;

        db.all("SELECT wins FROM qc_runs WHERE player=?", querySender, function(err, rows) {
            if(err) {
                console.log(err);
                client.sendBotNotice(queryRoom.roomId, "Failed to retrieve your stats : " + err);
                return;
            } else {
                rows.forEach(function(row) {
                    goldspent += 500;
                    runs++;

                    switch(row.wins) {
                        case 0:
                            goldwon += 100;
                            c_unco += 3;
                            break;
                        case 1:
                            goldwon += 200;
                            c_unco += 3;
                            break;
                        case 2:
                            goldwon += 300;
                            c_unco += 3;
                            break;
                        case 3:
                            goldwon += 400;
                            c_unco += 3;
                            break;
                        case 4:
                            goldwon += 500;
                            c_unco += 2;
                            c_rare += 1;
                            break;
                        case 5:
                            goldwon += 600;
                            c_unco += 2;
                            c_rare += 1;
                            break;
                        case 6:
                            goldwon += 800;
                            c_unco += 1;
                            c_rare += 2
                            break;
                        case 7:
                            goldwon += 1000;
                            c_unco += 1;
                            c_rare += 2;
                            break;
                    }
                });
                var netGold = goldwon - goldspent;
                message = "During your " + runs + " runs, " + querySender;
                if(netGold >= 0)
                    message += " won " + netGold + " gold, " + c_unco + " uncommon cards and " + c_rare + " rare cards!";
                else
                    message += " lost " + Math.abs(netGold) + " gold but got " + c_unco + " uncommon cards and " + c_rare + " rare cards!";

                client.sendBotNotice(queryRoom.roomId, message);
            }
        });
    }
    else if(query == "undo") {
        db.run("DELETE FROM qc_runs WHERE ")
    }
    else if(regex.exec(query)) {
        var wins = parseInt(query.substr(4,1));
        console.log(querySender + " completed a run with " + wins + " wins");

        if(wins < 0 || wins > 7) {
            client.sendBotNotice("Error: you can't have less than 0 wins or more than 7 wins");
            return;
        }

        db.run("INSERT INTO qc_runs (player, wins, run_date) VALUES (?, ?, ?)", querySender, wins, Math.floor(Date.now() / 1000), function(err) {
            if(err) {
                console.log(err);
                client.sendBotNotice(queryRoom.roomId, "Failed to register that QC run : " + err);
                return;
            }

            var extra = '';
            if (wins == 0) {
                extra = "My cybernetic eyes are bleeding, please don't do that again :("
            } else if(wins == 1) {
                extra = "Wow you suck...";
            } else if (wins <= 3) {
                extra = "You'll do better next time.";
            } else if (wins == 6) {
                extra = "Awesome!!";
            } else if (wins == 7) {
                extra = "I'm please to store your stats Master!"
            }

            client.sendBotNotice(queryRoom.roomId, querySender + ", your QC run has been logged. " + extra);
        });  
    }
}

exports.getHelp = function(details) {
    return '!qc       - Display your total QC stats \n' +
           '!qc add X - Log a run with X wins \n' +
           '!qc undo     - Delete last run logged \n' +
           '!qc view <N> - View last N runs (default 10)'
    ;
  };