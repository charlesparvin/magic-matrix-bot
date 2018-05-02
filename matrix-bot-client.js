// Loading our configuration file
var config = require('./matrix-bot-config.js').base;

// Load required modules
var q = require('q');
var request = require('request');
var http = require('http');
var fs = require('fs');
const path = require('path');

// We use the matrix SDK that needs to be set by the requiring module
exports.matrixSDK = {};

// We use a matrix client that needs to be set by the requiring module
exports.matrixClient = {};

var download = function(uri, filename, callback){
  request.head(uri, function(err, res, body){
    console.log("Downloading " + uri + " to " + filename);
    request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
  });
};

exports.uploadHttpImage = function(room, uri, text = 'Image', extname = 'png') {
  var final_path = config.localStorage + "/cards/" + text + "." + extname;

  return request.head(uri, function(err, res, body){
    console.log("Downloading " + uri + " to " + final_path);
    request(uri).pipe(fs.createWriteStream(final_path)).on('close', function(){

      if(!fs.existsSync(final_path)){
          console.log(final_path + "doesn't exists. Exiting!");
          return;
      }

      const filesize = fs.statSync(final_path).size;
      const stream = fs.createReadStream(final_path);

      let finalUrl = "https://parvin.ovh/_matrix/media/r0/upload";
      finalUrl += "?access_token="+encodeURIComponent("MDAxOGxvY2F0aW9uIHBhcnZpbi5vdmgKMDAxM2lkZW50aWZpZXIga2V5CjAwMTBjaWQgZ2VuID0gMQowMDI3Y2lkIHVzZXJfaWQgPSBAbWFnaWNib3Q6cGFydmluLm92aAowMDE2Y2lkIHR5cGUgPSBhY2Nlc3MKMDAyMWNpZCBub25jZSA9IF4uO0VOQHdrRjNRNV9uUyoKMDAyZnNpZ25hdHVyZSCiLThroM-2uKUdkk1gSjoZtmrX2Apb0ATcDnC2L32whwo");
      finalUrl += "&filename=" + encodeURIComponent(text+"."+extname);

      const options = {  
          url: finalUrl,
          method: 'POST',
          body: stream,
          headers: {
              'Content-Length': filesize,
              'Content-Type': 'image/' + extname
          }
      };
      
      return request(options, function(err, res, body) {  
      
          if(res === undefined || body === undefined){
              console.log("Error: "+JSON.stringify(err));
              return;
          }
      
          var statusCode = res.statusCode;
          if (statusCode != 200) {
              console.log(res.statusCode);
              console.log(body);
              return;
          }
    
          var json = JSON.parse(body);
    
          console.log("Successful download: " + text);   

          return json.content_uri;
      });
    });
  });
}

exports.sendImage = function(room, uri, text = 'Image', extname = 'png') {

  var final_path = config.localStorage + "/cards/" + text + "." + extname;

  request.head(uri, function(err, res, body){
    console.log("Downloading " + uri + " to " + final_path);
    request(uri).pipe(fs.createWriteStream(final_path)).on('close', function(){

      if(!fs.existsSync(final_path)){
          console.log(final_path + "doesn't exists. Exiting!");
          return;
      }

      const filesize = fs.statSync(final_path).size;
      const stream = fs.createReadStream(final_path);

      let finalUrl = "https://parvin.ovh/_matrix/media/r0/upload";
      finalUrl += "?access_token="+encodeURIComponent("MDAxOGxvY2F0aW9uIHBhcnZpbi5vdmgKMDAxM2lkZW50aWZpZXIga2V5CjAwMTBjaWQgZ2VuID0gMQowMDI3Y2lkIHVzZXJfaWQgPSBAbWFnaWNib3Q6cGFydmluLm92aAowMDE2Y2lkIHR5cGUgPSBhY2Nlc3MKMDAyMWNpZCBub25jZSA9IF4uO0VOQHdrRjNRNV9uUyoKMDAyZnNpZ25hdHVyZSCiLThroM-2uKUdkk1gSjoZtmrX2Apb0ATcDnC2L32whwo");
      finalUrl += "&filename=" + encodeURIComponent(text+"."+extname);

      const options = {  
          url: finalUrl,
          method: 'POST',
          body: stream,
          headers: {
              'Content-Length': filesize,
              'Content-Type': 'image/' + extname
          }
      };
      
      request(options, function(err, res, body) {  
      
          if(res === undefined || body === undefined){
              console.log("Error: "+JSON.stringify(err));
              return;
          }
      
          var statusCode = res.statusCode;
          if (statusCode != 200) {
              console.log(res.statusCode);
              console.log(body);
              return;
          }
    
          var json = JSON.parse(body);
    
          console.log("Successful download: " + text);   

          var content = {
              msgtype: "m.image",
              body: text,
              url: json.content_uri
          };
          exports.matrixClient.sendMessage("!YzYSHpQFFMrNjDoCuz:parvin.ovh", content);
      });
    });
  });
}

/*

 The sendBotNotice(room, message) function sends a notice to the given room.

 It is basically a wrapper around the matrix client sendNotice function with a catch for catching
 UnknownDeviceErrors.

 */
exports.sendBotNotice = function(roomId, message) {
  // Obtain a transaction ID.
  var txnId = exports.matrixClient.makeTxnId();

  

  return exports.matrixClient.sendNotice(roomId, message, txnId).catch(function(err) {

    if(err.name == 'UnknownDeviceError') {
      console.log('UnknownDeviceError caught. Will resend pending event...');

      // Okay. We set all devices found as known, send a warning and then retry the sent message.
      var warningText = 'WARNING: I have found new devices which I will now encrypt my messages to:';
      Object.keys(err.devices).forEach(function(userId) {
        warningText = warningText + '\n- ' + userId + ': ';
        Object.keys(err.devices[userId]).forEach(function(deviceId, idx) {
          warningText = warningText + (idx > 0 ? ', ' : '') + deviceId;

          // Set device as known!
          exports.matrixClient.setDeviceKnown(userId, deviceId);
        });
      });

      // Send warning notice.
      exports.sendBotNotice(roomId, warningText);


      // Okay. We retry the sent message.
      var room = exports.matrixClient.getRoom(roomId);

      room.getLiveTimeline().getEvents().forEach(function(evt) {
        if(evt._txnId === txnId) {
          return exports.matrixClient.resendEvent(evt, room);
        }
      });

    } else {
      // We do not handle this error
      return q.reject(err);
    }
  });
};