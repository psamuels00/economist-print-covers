//--------------------------------------------------------------------------------
//                                dependencies
//--------------------------------------------------------------------------------


process.stdout.write('load phantom library...');
const phantom = require('phantom');
console.log('');

const jsdom = require("jsdom");


//--------------------------------------------------------------------------------
//                               generic support
//--------------------------------------------------------------------------------


function lastPartOfPath(str) {
    const n = str.lastIndexOf('/');
    return (n >= 0) ? str.substring(n + 1) : '';
}


function indexPageUrl(year) {
    return 'https://www.economist.com/printedition/covers'
           + '?' + encodeURIComponent('date_filter[value][year]') + '=' + year
           + '&' + 'print_region=76980';
}


//--------------------------------------------------------------------------------
//                        virtual browser - PhantomJS
//--------------------------------------------------------------------------------


async function initBrowserInstance(phantom) {
    const instance = await phantom.create();

    // disable info logging
    instance.logger.info = function() {}

    return instance;
}


async function initBrowserPage(instance) {
    // create virtual page
    const page = await instance.createPage();

    // ignore the pollution of other requests embedded in The Economist pages
    await page.on('onResourceRequested', true, function(requestData, networkRequest) {
        if (!requestData.url.match(/economist.com/g)) {
            networkRequest.abort();
        }
    });

    return page;
}


async function fetchPage(page, url, label) {
    // fetch and execute page
    const status = await page.open(url);

    // get page content
    const content = await page.property('content');

    return content
}


//--------------------------------------------------------------------------------
//                               parse HTML/DOM
//--------------------------------------------------------------------------------


function parseIndexPage(content) {
    // parse index page HTML
    const { JSDOM } = jsdom;
    const { document } = (new JSDOM(content)).window;

    let issues = [];

    // parse index page DOM
    var thumbnails = document.querySelectorAll('.print-cover-image a');
    thumbnails.forEach(function(a) {
        let ymd = lastPartOfPath(a.href);
        let url = a.querySelector('img').src;
        issues.push({ ymd, url });
    });

    return issues;
}


//--------------------------------------------------------------------------------
//                                 process year
//--------------------------------------------------------------------------------


async function processYear(page, year) {
    // get url of index page for given year
    const url = indexPageUrl(year);

    // fetch executed page content
    const content = await fetchPage(page, url, `index page for year ${year}`);

    // parse index page DOM
    const issues = parseIndexPage(content);

    // display thumbnail images
    console.log('Thumbnail images:');
    issues.forEach(function(issue) {
        console.log('  ', issue.ymd, issue.url);
    });
}


//--------------------------------------------------------------------------------
//                                   main
//--------------------------------------------------------------------------------


async function run() {
    // create virtual browser environment
    const instance = await initBrowserInstance(phantom);

    // create virtual page
    const page = await initBrowserPage(instance);

    // fetch and parse index page for current year
    const date = new Date();
    const year = date.getFullYear();
    await processYear(page, year);

    await instance.exit();
}


//--------------------------------------------------------------------------------
//                                  exports
//--------------------------------------------------------------------------------


exports.run = run;
// for testing
exports.phantom = phantom;
exports.lastPartOfPath = lastPartOfPath;
exports.indexPageUrl = indexPageUrl;
exports.fetchPage = fetchPage;
exports.initBrowserInstance = initBrowserInstance;
exports.initBrowserPage = initBrowserPage;
exports.parseIndexPage = parseIndexPage;
