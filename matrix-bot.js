///// WELCOME
console.log('Welcome to the Magic Matrix Bot!');
console.log('Initializing modules and starting up...');

// Loading our configuration file
var config = require('./matrix-bot-config.js').base;

// We define various helper functions for Matrix in matrix-bot-client.js...
var client = require('./matrix-bot-client.js');

var mtg = require('mtgsdk');

client['mtg'] = mtg;

// Use q
var q = require('q');

// Loading localStorage module
if (typeof localStorage === "undefined" || localStorage === null) {
  var LocalStorage = require('node-localstorage').LocalStorage;
  var localStorage = new LocalStorage(config.localStorage);
}

// Loading libolm
try {
  console.log('Loading olm...');
  global.Olm = require('olm');
} catch (err) {
  console.log('ERROR: We couldn\'t load libolm: ' + err);
  console.log('ERROR: libolm is required as Magic Matrix Bot uses end-to-end encryption.');
  process.exit(1);
}

// Loading Matrix SDK
var sdk = require("matrix-js-sdk");
client.matrixSDK = sdk;


///// CONFIGURATION OF BOT-MODULES

var botModules = {};

botModules['help'] = require("./bot-modules/help.js");
botModules['card'] = require('./bot-modules/card.js');
botModules['clear'] = require('./bot-modules/clear.js');
botModules['qc'] = require('./bot-modules/stats_qc.js');

// Do we need to login first?
var loginPromise;
if(localStorage.getItem('deviceId') === null || localStorage.getItem('accessToken') === null) {
  // We need to login. Create matrix client just for logging in...
  var loginClient = sdk.createClient({
    baseUrl: config.botBaseUrl
  });

  console.log('Trying to log in...');
  loginPromise = loginClient
    .login('m.login.password', {
      user: config.botUserId,
      password: config.botPassword,
      initial_device_display_name: 'MagicMatrixBot'
    })
    .then(function(res) {
      console.log('Logged in as ' + res.user_id);
      localStorage.setItem('userId', res.user_id);
      localStorage.setItem('accessToken', res.access_token);
      localStorage.setItem('deviceId', res.device_id);
    }, function(err) {
      console.log('An error occured logging in!');
      console.log(err);
      process.exit(1);
    });
} else {
  // We are already logged in and can directly start our main client.
  console.log('We are already logged in as ' + localStorage.getItem('userId') + '.');
  loginPromise = q.resolve();
}


loginPromise.then(function() {
  // Create primary Matrix client
  client.matrixClient = sdk.createClient({
    baseUrl: config.botBaseUrl,
    accessToken: localStorage.getItem('accessToken'),
    userId: localStorage.getItem('userId'),
    sessionStore: new sdk.WebStorageSessionStore(localStorage),
    deviceId: localStorage.getItem('deviceId')
  });

  // Automatically join rooms when invited
  client.matrixClient.on("RoomMember.membership", function(event, member) {
    if (member.membership === "invite" && member.userId === localStorage.getItem('userId')) {
      console.log("Received invite for %s from %s. Auto-joining...", member.roomId, event.getSender());

      client.matrixClient.joinRoom(member.roomId)
        .then(function() {
          console.log("Auto-joined %s", member.roomId);
        })
        .catch(function(err) {
          console.log("Could not join room %s because of an error:", member.roomId);
          console.log(err);

          // We leave (=reject invite) rooms that cannot be joined because they have no users left.
          if(err.message === 'No known servers') {
            console.log('We reject invite for room (' + member.roomId + ') we will not be able to join...');
            return matrixClient.leave(member.roomId);
          }
        }).catch(function(err) {
        // Unexpected error
        console.log('An error occured while trying to reject / process room invites:' + JSON.stringify(err));
      })
        .done();
    } else if(member.userId === localStorage.getItem('userId')) {
      console.log("Received UNPROCESSED membership event of type %s for myself in room %s from %s.", member.membership, member.roomId, event.getSender());

      // TODO: Enable processing of other events (kicks, bans, etc.)
    }
  });

  client.matrixClient.once('sync', function(state, prevState) {
    if(state === 'PREPARED') {
      // Ok, we are ready to listen to new messages and to perform initial set-up.

      // Listen for messages starting with a bang (!)
      client.matrixClient.on("Room.timeline", function(event, room, toStartOfTimeline) {
        if (toStartOfTimeline || event.getSender() === localStorage.getItem('userId')) {
          return; // don't use stale results or own data
        }
        if (event.getType() !== "m.room.message") {
          return; // only use messages
        }

        // Log to console
        console.log(
          // the room name will update with m.room.name events automatically
          "(%s) %s :: %s", room.name, event.getSender(), event.getContent().body
        );

        console.log('Event data:' + JSON.stringify(event.getUnsigned()));


        // Is it a bang?
        var botCommand;
        if(botCommand = event.getContent().body.match(/^\s*!([a-z]+)( (.+))?/)) {
          // Log to console
          console.log('Bang match: ' + botCommand[1] + ' ' + botCommand[3]);

          if(botModules[botCommand[1]]) {
            // Log to console
            console.log('Module found for ' + botCommand[1] +'. Executing...');

            // Run relevant module
            botModules[botCommand[1]].runQuery(client, botCommand[3], event.getSender(), room);
          }
        }
      });

      // Is encryption being enabled on the room? Then display a warning!
      client.matrixClient.on('event', function(event) {
        if (event.isState() && event.getType() === 'm.room.encryption') {
          client.sendBotNotice(event.getRoomId(), 'WARNING: You are running Magic Matrix Bot in an encrypted room. This means that the server the bot is running on will be able to decrypt all messages received (and thus needs to be trusted). Also, Magic Matrix Bot will automatically trust new devices present in this room, opening up the possibility of MITM attacks on the bot\'s notices. PLEASE PROCEED WITH CARE AND DO NOT USE MAGIC MATRIX BOT IN SENSITIVE ENVIRONMENTS.');
        }
      });

      // Print device ID and key for verification.
      console.log('ENCRYPTION DATA FOR VERIFICATION');
      console.log('Our device ID:                   ' + localStorage.getItem('deviceId'));
      console.log('Our device key for verification: ' + client.matrixClient.getDeviceEd25519Key());


      // Find rooms.
      console.log('We are participating in the following rooms:');
      client.matrixClient.getRooms().forEach(function(room) {
        console.log(' - %s (%s)', room.name, room.roomId);
      });


      // Initialise modules where required
      Object.keys(botModules).forEach(function(module) {
        if (botModules[module]['runSetup']) {
          botModules[module].runSetup(client);
        }
      });

      


    } else {
      // Something went wrong. We exit.
      console.log('Matrix SYNC did not progress into the expected PREPARED phase (new sync state %s from %s). We exit.', state, prevState);
      process.exit(1);
    }
  });

  // We use the default initialSyncLimit of 8 as it is also used for subsequent requests
  // However, we ignore messages older than 3 minutes (see above) to avoid replying to stale requests
  try {
    client.matrixClient.startClient({});
  } catch(err) {
    console.log('WARNING: Caught matrixClient error:');
    console.log(err);
    console.log('WARNING: You might need to restart the bot.');
  }
});