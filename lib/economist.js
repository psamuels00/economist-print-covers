process.stdout.write('load phantom library...');
const phantom = require('phantom');
console.log('');

const jsdom = require("jsdom");


//--------------------------------------------------------------------------------
//                                  support
//--------------------------------------------------------------------------------


function indexPageUrl(year) {
    return 'https://www.economist.com/printedition/covers'
           + '?' + encodeURIComponent('date_filter[value][year]') + '=' + year
           + '&' + 'print_region=76980';
}


function ymdAtEot(str) {
    const n = str.lastIndexOf('/');
    return (n >= 0) ? str.substring(n + 1) : '';
}


function parseIndexPage(content) {
    // parse index page HTML
    const { JSDOM } = jsdom;
    const { document } = (new JSDOM(content)).window;

    // parse index page DOM
    var thumbnails = document.querySelectorAll('.print-cover-image a');
    console.log('Thumbnail images:');
    thumbnails.forEach(function(a) {
        let ymd = ymdAtEot(a.href);
        let url = a.querySelector('img').src;
        console.log('  ', ymd, url);
    });
}


async function processYear(page, year) {
    // get url of index page for current year
    const url = indexPageUrl(year);

    // fetch and execute index page
    process.stdout.write('fetch and execute the page...');
    const status = await page.open(url);
    console.log('');

    // get page content
    const content = await page.property('content');

    // parse index page DOM
    parseIndexPage(content);
}


//--------------------------------------------------------------------------------
//                                   main
//--------------------------------------------------------------------------------


async function run() {
    // create virtual browser environment
    const instance = await phantom.create()

    // disable info logging
    const loggerInfo = instance.logger.info
    instance.logger.info = function() {}

    // create virtual page
    process.stdout.write('create page from phantom instance...');
    const page = await instance.createPage();
    console.log('');

    // ignore the pollution of other requests embedded in The Economist pages
    page.on('onResourceRequested', true, function(requestData, networkRequest) {
        if (!requestData.url.match(/economist.com/g)) {
            networkRequest.abort();
        }
    });

    // get current year
    const date = new Date();
    const year = date.getFullYear();

    // fetch and parse index page for current year
    await processYear(page, year);

    await instance.exit();
}


//--------------------------------------------------------------------------------
//                                  exports
//--------------------------------------------------------------------------------


exports.run = run;
// for testing
exports.ymdAtEot = ymdAtEot;
