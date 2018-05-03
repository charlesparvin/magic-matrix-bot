var request = require('request');
var fs = require('fs');

var method = CardQuery.prototype;

function CardQuery(client, room, cardsToSend, rc)
{
    this.client = client;
    this.room = room;
    this.cardsToSend = cardsToSend;
    this.resultsCount = rc;
}

CardQuery.prototype.answerQuery = function()
{
    for(var i=0; i < this.cardsToSend.length; i++) {
        console.log("Uploading Image " + i)
        this.downloadImage(i);
    }
}

CardQuery.prototype.downloadImage = function(i) {
    var uri = this.cardsToSend[i].image;
    var fileName = this.cardsToSend[i].tmpFile;

    var that = this;

    if(fs.exists(fileName)) {
        this.uploadImage(i);
    } 
    else {
        request.head(uri, function(err, res, body){
            console.log("Downloading " + uri + " to " + fileName);
            request(uri).pipe(fs.createWriteStream(fileName)).on('close', function(){ that.uploadImage(i)} );
        });
    }
}

CardQuery.prototype.uploadImage = function(i) {
    console.log("Upload called for image " + i);

    var fileName = this.cardsToSend[i].tmpFile;
    var extname = this.cardsToSend[i].imageType;

    if(!fs.existsSync(fileName)){
        console.log(fileName + "doesn't exists. Exiting!");
        return;
    }

    const filesize = fs.statSync(fileName).size;
    const stream = fs.createReadStream(fileName);

    let finalUrl = config.botBaseUrl + "/_matrix/media/r0/upload";
    finalUrl += "?access_token="+encodeURIComponent(client.accessToken);
    finalUrl += "&filename=" + encodeURIComponent(this.cardsToSend[i].name+"."+extname);

    const options = {  
        url: finalUrl,
        method: 'POST',
        body: stream,
        headers: {
            'Content-Length': filesize,
            'Content-Type': 'image/' + extname
        }
    };

    that = this;
    request(options, function(err, res, body) {  
      
        if(res === undefined || body === undefined){
            console.log("Error: "+JSON.stringify(err));
            that.setMXC(i, false);
            return;
        }
    
        var statusCode = res.statusCode;
        if (statusCode != 200) {
            console.log(res.statusCode);
            console.log(body);
            that.setMXC(i, false);
            return;
        }
    
        var json = JSON.parse(body);
        that.setMXC(i, json.content_uri)
    });
}

CardQuery.prototype.setMXC = function(i, mxcUri) {
    console.log("Setting mxc " + i + " : " + mxcUri);
    this.cardsToSend[i].mxc = mxcUri;

    // check if we got all cards done !
    for(i=0; i<this.cardsToSend.length;i++) {
        if(this.cardsToSend[i].mxc === null)
            return;
    }

    // all good, craft the message !
    var markdown = "### Displaying " + this.cardsToSend.length + " out of " + this.resultsCount + " results\n";
    var html = "<h3>Displaying " + this.cardsToSend.length + " out of " + this.resultsCount + " results</h3><p>";

    for(i=0; i<this.cardsToSend.length;i++) {
        if(this.cardsToSend[i].mxc === false) {
            this.client.sendBotNotice(this.room, "ERROR: Unable to load image for " + this.cardsToSend[i].name);
        } else {
            markdown += "!["+this.cardsToSend[i].name+"]("+this.cardsToSend[i].mxc+") ";
            html += "<img src=\""+this.cardsToSend[i].mxc+"\" alt=\""+this.cardsToSend[i].name+"\" />";
        }
        
    }

    html += "</p>";

    var content = {
        msgtype: "m.text",
        body: markdown,
        format: "org.matrix.custom.html",
        formatted_body: html
    };

    this.client.matrixClient.sendMessage(this.room, content);
}

module.exports = CardQuery;