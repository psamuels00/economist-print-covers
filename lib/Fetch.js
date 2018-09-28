'use strict';

//--------------------------------------------------------------------------------
//                                dependencies
//--------------------------------------------------------------------------------


const https = require('https');
const JSDOM = require('jsdom').JSDOM;


//--------------------------------------------------------------------------------
//                                   public
//--------------------------------------------------------------------------------


async function fetchPage(url) {
    const dom = await JSDOM.fromURL(url);
    const content = dom.serialize();
    return content
}


async function fetchImage(url) {
    const content = await new Promise((resolve) => {

        https.get(url, function(res) {
            let data = [];
            res.on('data', function(chunk) {
                data.push(chunk);
            }).on('end', function() {
                resolve(Buffer.concat(data));
            });
        });

    }).catch((err) => {
        console.error('Error fetching image: ' + err.toString());
    });

    return content;
}


//--------------------------------------------------------------------------------
//                                  exports
//--------------------------------------------------------------------------------


exports.fetchPage = fetchPage;
exports.fetchImage = fetchImage;
