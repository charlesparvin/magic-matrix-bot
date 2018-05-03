var config = require('../matrix-bot-config').base;
var sqlite3 = require('sqlite3').verbose();
var q = require('q');
var db = new sqlite3.Database(config.sqliteDatabase);

exports.runQuery = function(client, query, querySender, queryRoom) {
    var params, line;
  
    var regexViewLogs = /^view\s?(\d{1,2})?$/;
    var regexAddRun = /^add \d{1}$/;

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
                var winValues = [];
                rows.forEach(function(row) {
                    goldspent += 500;
                    runs++;
                    winValues.push(row.wins);

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

                var averageWins = Math.round(winValues.reduce(function(a, b) { return a + b; })/winValues.length, 2);
                var medianWins = median(winValues);
                var netGold = goldwon - goldspent;

                message = "In " + runs + " runs (Avg wins: "+averageWins+" | Median wins: "+medianWins+"), " + querySender;
                if(netGold >= 0)
                    message += " won " + netGold + " gold, " + c_unco + " uncommon cards and " + c_rare + " rare cards!";
                else
                    message += " lost " + Math.abs(netGold) + " gold but got " + c_unco + " uncommon cards and " + c_rare + " rare cards!";

                client.sendBotNotice(queryRoom.roomId, message);
            }
        });
    }
    else if(query == "undo") {
        db.get("SELECT * FROM qc_runs WHERE player=? ORDER BY run_date DESC LIMIT 0,1", querySender, function(err, row) {
            if(err) {
                console.log(err);
                client.sendBotNotice(queryRoom.roomId, "Failed to delete last run : " + err);
                return;
            } else {
                db.run("DELETE FROM qc_runs WHERE run_id=?", [row.run_id], function(err) {
                    if(err) {
                        console.log(err);
                        client.sendBotNotice(queryRoom.roomId, "Failed to delete last run : " + err);
                        return;
                    } else {
                        var ds = new Date(row.run_date*1000).toISOString().replace(/T/, ' ').replace(/\..+/, '');
                        client.sendBotNotice(queryRoom.roomId, "Deleted the run ("+row.wins+" wins) logged on " + ds);
                    }
                })
            }
        });
    }
    else if(m = regexViewLogs.exec(query)) {
        var nb = parseInt(m[1]) || 10;
        nb = Math.min(Math.max(nb, 1), 99);

        db.all("SELECT * FROM qc_runs WHERE player=? ORDER BY run_date DESC LIMIT 0,?", [querySender, nb], function(err, rows) {
            if(err) {
                console.log(err);
                client.sendBotNotice(queryRoom.roomId, "Failed to retrieve your stats : " + err);
                return;
            } else {
                var text = querySender+"'s last "+nb+" runs\n";
                var html = querySender+"'s last "+nb+" runs<table>";
                rows.forEach(function(row) {
                    var ds = new Date(row.run_date*1000).toISOString().replace(/T/, ' ').replace(/\..+/, '');
                    var wins = row.wins;
                    
                    var color = '#6e98c1';
                    if (wins <= 1) {
                        color = '#EE0000';
                    } else if (wins <= 3) {
                        color = 'FF3333';
                    } else if(wins >= 5) {
                        color = '#bdd67e';
                    } else if(wins >= 7) {
                        color = '#94bc2d';
                    }
            


                    text += ds + " | " + wins + " wins\n";
                    html += "<tr><td><font color='"+color+"'>"+ds+"</font></td><td><font color='"+color+"'>"+wins+" wins</font></td></tr>";
                });

                html += "</table>";

                client.sendBotMessage(queryRoom.roomId, text, html);

                /*
                var content = {
                    msgtype: "m.text",
                    body: text,
                    format: "org.matrix.custom.html",
                    formatted_body: html
                };
            
                client.matrixClient.sendMessage(queryRoom.roomId, content);
                */
            }
        });
    }
    else if(m = regexAddRun.exec(query)) {
        var wins = parseInt(m[1]);
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
}

function median(values) {
    values.sort( function(a,b) {return a - b;} );

    var half = Math.floor(values.length/2);

    if(values.length % 2)
        return values[half];
    else
        return (values[half-1] + values[half]) / 2.0;
}