var CardQuery = require('./card/cardQuery');
var config = require('../matrix-bot-config').base;
var crypto = require('crypto')

exports.runQuery = function(client, query, querySender, queryRoom) {
  var params, line;

  client.mtg.card.where({ 
    name: query
  }).then(cards => {
    cardsToSend = [];
    
    for(i=0; i<cards.length && cardsToSend.length < 3; i++) {
      card = cards[i];  
      if(card == undefined || card.name == undefined) {
        client.sendBotNotice(queryRoom.roomId, "Card #"+i+" is undefined");
      }
      else if (card.imageUrl == undefined) {
        console.log(card);
        client.sendBotNotice(queryRoom.roomId, "Card #"+i+" ("+card.name+") has no imageUrl prop");
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

    if (cards.length == 0) {      
      client.sendBotNotice(queryRoom.roomId, "No results for '" + query + "'");
    }
    else {
      var q = new CardQuery(client, queryRoom.roomId, cardsToSend, cards.length);
      q.answerQuery();
    }
  });
};

exports.getHelp = function(details) {
  return 'You can use !card <partial card name> to search MTG cards.';
};