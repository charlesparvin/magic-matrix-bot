///// CONFIGURATION OF HELP MODULES

var helpModules = {};

helpModules['card'] = require("./card.js").getHelp;
helpModules['clear'] = require("./clear.js").getHelp;
helpModules['stats'] =  require("./stats_qc.js").getHelp;

exports.runQuery = function(client, query, querySender, queryRoom) {
  var params, line;

  console.log('Helped called for ' + query);

  if(query && (params = query.match(/([a-zA-Z0-9]+)( (.+))?/))) {
    if(helpModules[params[1]]) {
      line = helpModules[params[1]](params[3]);
    } else {
      line = 'Hello there! Unfortunately, the module "' + params[1] + '" does not yet exist...';
    }
  } else {
    line = 'Here are all my command groups:\n\n';

    Object.keys(helpModules).forEach(function(k) {
      line += '!help ' + k + '\n';
    });
    
    line += '\nIf you want me to help you in your own Matrix room, just invite me and I will join automatically. You do no longer want me in your room? Just kick me out.';
  }

  console.log(line);
  client.sendBotNotice(queryRoom.roomId, line);
};
