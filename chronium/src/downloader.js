const fs = require('fs');
const request = require('request');

var downloader = function(uri, filename, callback){
  request.head(uri, function(err, res, body){    
    request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
  });
};

function download(url) {
  return new Promise((resolve, reject) => {
    downloader(url, './captchas/download.jpg', () => {
      console.log("downloading complete");
      resolve(true)
    });
  })
}

module.exports = download;