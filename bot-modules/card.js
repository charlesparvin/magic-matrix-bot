var CardQuery = require('./card/cardQuery');
var config = require('../matrix-bot-config').base;
var crypto = require('crypto')

exports.runQuery = function(client, query, querySender, queryRoom) {
  var params, line;

  
  if(query.length == 0)
    return;

  var args = query.split(' ');
  if(args[0] == "showsets") {
    client.sendBotNotice(queryRoom.roomId, "I'm current configured to search within the following sets : " + config.mtgaSets)
  }
  else if(args[0] == "all") {
    args.shift();
    search = {name: args.join()}
  } else if (args[0] == "modern") {
    args.shift();
    search = {gameFormat: "Modern", name: args.join()};
  } else {
    search = {set: config.mtgaSets, name: args.join()};
  }

  search['contains'] = 'imageUrl';
  search['pageSize'] = 10;

  client.mtg.card.where(search).then(cards => {
    cardsToSend = [];
    // start from the end to clear duplicates
    for(i=0; i<cards.length && cardsToSend.length < 3; i++) {
      card = cards[i];  

      if(config.filterDuplicates && cardsToSend.filter(c => c.name === card.name).length > 0)
        continue;

      if(card == undefined || card.name == undefined) {
       console.log("Card #"+i+" is undefined");
      }
      else if (card.imageUrl == undefined) {
        console.log("Card #"+i+" ("+card.name+") has no imageUrl prop");
      }
      else {
        cardsToSend.push({
          image: card.imageUrl, 
          imageType : 'png',
          name: card.name, 
          tmpFile: config.localStorage + "/cards/" + crypto.createHash('md5').update(card.imageUrl).digest('hex') + ".png",
          mxc: null
        });
      }
    }

    if (cardsToSend.length == 0) {      
      client.sendBotNotice(queryRoom.roomId, "No results for '" + query + "'");
    }
    else {
      var q = new CardQuery(client, queryRoom.roomId, cardsToSend, cards.length);
      q.answerQuery();
    }
  });
};

exports.getHelp = function(details) {
  return '!card <partial card name> searches MTGA cards\n'
    + '"!card std <partial card name>" searches standard cards\n'  
    + '"!card modern <partial card name>" searches modern cards\n'
    + '"!card all <partial card name>" searches all cards\n'
    + '"!card showsets" shows sets the base !card commands searches within\n'
  ;
};