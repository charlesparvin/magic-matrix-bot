var config = require('../matrix-bot-config').base;
var fs = require('fs');
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(config.sqliteDatabase);

exports.runQuery = function(client, query, querySender, queryRoom) {
    var params, line;
  
    if(query == "cache") {
        console.log("clearing cache");
        fs.readdir( config.localStorage + "/cards/", function( err, files ) {
            if ( err ) return console.log( err );
            files.forEach(function( file ) {
                var filePath = config.localStorage + "/cards/" + file; 
                fs.unlink( filePath, function( err ) {
                    if ( err ) return console.log( err );
                });
            });
        });
        client.sendBotNotice(queryRoom.roomId, "Card images in cache have been cleared");
        return;
    }

    if(query == "stats") {
        client.sendBotNotice(queryRoom.roomId, "Stats for " + querySender + " have been cleared");
        return;
    }
}

exports.getHelp = function(details) {
    return '!clear cache    - Remove all locally stored card images \n' +
           '!clear stats    - Resets your own QC/Draft stored stats'
    ;
  };