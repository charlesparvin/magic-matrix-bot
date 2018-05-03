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

/*

 The sendBotMessage(room, text, html) function sends a rich-text message to the given room.

 It is basically a wrapper around the matrix client sendNotice function with a catch for catching
 UnknownDeviceErrors.

 */
exports.sendBotMessage = function(roomId, text, html) {
  // Obtain a transaction ID.
  var txnId = exports.matrixClient.makeTxnId();

  var content = {
    msgtype: "m.text",
    body: text,
    format: "org.matrix.custom.html",
    formatted_body: html
};

  return exports.matrixClient.sendMessage(roomId, content, txnId).catch(function(err) {

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