'use strict';

//--------------------------------------------------------------------------------
//                                dependencies
//--------------------------------------------------------------------------------


const JSDOM = require('jsdom').JSDOM;
const util = require('./Util.js');


//--------------------------------------------------------------------------------
//                                   public
//--------------------------------------------------------------------------------


// return [
//     {
//         ymd: '2018-09-01',
//         displayDate: 'Sep 1st 2018',
//         issuePageUrl: 'http://...',
//         thumbnailImageUrl: 'https://www.economist.com/sites/default/files/imagecache/' +
//                            'print-cover-thumbnail/print-covers/20180616_cna400.jpg',
//     },...
// ]
function parseIndexPage(content) {
    // parse index page HTML
    const { document } = (new JSDOM(content)).window;

    let issues = [];

    // parse index page DOM
    const covers = document.querySelectorAll('.views-print-cover');
    Array.from(covers).forEach(function(cover) {
        const a = cover.querySelector('a');
        const ymd = util.lastPartOfPath(a.href);
        const thumbnailImageUrl = a.querySelector('img').src;
        const displayDate = cover.querySelector('span.date-display-single').innerHTML;
        issues.push({
            ymd,
            displayDate,
            issuePageUrl: util.issuePageUrl(ymd),
            thumbnailImageUrl,
        });
    });

    return issues;
}


//--------------------------------------------------------------------------------
//                                  exports
//--------------------------------------------------------------------------------


exports.parseIndexPage = parseIndexPage;
