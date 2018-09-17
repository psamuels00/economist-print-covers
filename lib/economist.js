'use strict';

//--------------------------------------------------------------------------------
//                                dependencies
//--------------------------------------------------------------------------------


const phantom = require('phantom');
const jsdom = require('jsdom');
const fs = require('fs');
const mkdirSync = require('node-fs').mkdirSync;


//--------------------------------------------------------------------------------
//                                 this module
//--------------------------------------------------------------------------------


// invoking a function through thisModule ensures a stub is used if defined in a test
let thisModule = this;


//--------------------------------------------------------------------------------
//                                  constants
//--------------------------------------------------------------------------------


let config = {
    economistUrl: 'https://www.economist.com/printedition',
};


//--------------------------------------------------------------------------------
//                            execution environment
//--------------------------------------------------------------------------------


function isTesting() {
    return 'NODE_ENV' in process.env && process.env.NODE_ENV == 'test';
}


function isProduction() {
    return !isTesting();
}


//--------------------------------------------------------------------------------
//                               generic support
//--------------------------------------------------------------------------------


function lastPartOfPath(str) {
    const n = str.lastIndexOf('/');
    return (n >= 0) ? str.substring(n + 1) : '';
}


function directoryPartOfPath(str) {
    const n = str.lastIndexOf('/');
    return (n == 0) ? '/' : (n > 0) ? str.substring(0, n) : '';
}


function indexPageUrl(year) {
    return config.economistUrl + '/covers'
           + '?' + encodeURIComponent('date_filter[value][year]') + '=' + year
           + '&' + 'print_region=76980';
}


function issuePageUrl(ymd) {
    return config.economistUrl + '/' + ymd;
}


function cacheFilePath(type, params) {
    let path;

    if (type == 'index') {
        path = `_CACHE/${params.year}/index.html`;
    }

    return path;
}


function getCurrentYear() {
    return (new Date()).getFullYear();
}


function getCurrentTimeMillis() {
    return Date.now();
}


function getFileMtimeMillis(file) {
    let millis;
    let stat;
    try {
        stat = fs.statSync(file);
    } catch(e) {
        stat = undefined;
    }

    if (stat == undefined) {
        ; //nop
    } else if (!('mtimeMs' in stat)) {
        throw new Error(`stat for ${file} has no 'mtimeMs'`);
    } else if (stat.mtimeMs.length == 0) {
        throw new Error(`stat for ${file} has empty 'mtimeMs'`);
    } else if (stat.mtimeMs == 0) {
        throw new Error(`stat for ${file} has zero 'mtimeMs'`);
    } else if (! (new String(stat.mtimeMs)).match(/^\d+$/)) {
        throw new Error(`stat for ${file} has invalid 'mtimeMs'`);
    } else {
        millis = stat.mtimeMs;
    }

    return millis;
}


//--------------------------------------------------------------------------------
//                                  cache file
//--------------------------------------------------------------------------------


function loadContentFromCacheFile(file, expireSec) {
    var content;

    let loadFile = true;

    if (!fs.existsSync(file)) {
        loadFile = false;
    } else if (expireSec) {
        const fileMs = thisModule.getFileMtimeMillis(file);
        const expireMs = fileMs + expireSec * 1000;
        const currentMs = thisModule.getCurrentTimeMillis();
        loadFile = currentMs < expireMs;
    }

    if (loadFile) {
        content = fs.readFileSync(file, 'utf8');
    }

    return content;
}


function saveContentToCacheFile(file, content) {
    const dir = thisModule.directoryPartOfPath(file);
    if (!fs.existsSync(dir)) {
        mkdirSync(dir, 0o777, true);
    }
    fs.writeFileSync(file, content);
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


async function fetchPage(page, url) {
    // fetch and execute page
    const status = await page.open(url);

    // get page content
    const content = await page.property('content');

    return content
}


//--------------------------------------------------------------------------------
//                               parse HTML/DOM
//--------------------------------------------------------------------------------


// return [
//     {
//         ymd: '2018-09-01',
//         issuePageUrl: 'http://...',
//         thumbnailImageUrl: 'http://...',
//     },...
// ]
function parseIndexPage(content) {
    // parse index page HTML
    const { JSDOM } = jsdom;
    const { document } = (new JSDOM(content)).window;

    let issues = [];

    // parse index page DOM
    var thumbnails = document.querySelectorAll('.print-cover-image a');
    thumbnails.forEach(function(a) {
        let ymd = thisModule.lastPartOfPath(a.href);
        let thumbnailImageUrl = a.querySelector('img').src;
        issues.push({
            ymd,
            issuePageUrl: thisModule.issuePageUrl(ymd),
            thumbnailImageUrl,
        });
    });

    return issues;
}


//--------------------------------------------------------------------------------
//                                 process year
//--------------------------------------------------------------------------------


async function loadPageContentFromNet(year, page) {
    // get url of index page for given year
    const url = thisModule.indexPageUrl(year);

    // fetch executed page content
    const content = await thisModule.fetchPage(page, url);

    return content;
}


async function loadIndexPageContent(year, page) {
    const cacheFile = thisModule.cacheFilePath('index', { year: year });

    let expireSec = year == thisModule.getCurrentYear() ? 24 * 3600: 0;

    let content = {
        source: 'cache',
        data: thisModule.loadContentFromCacheFile(cacheFile, expireSec),
    };

    if (!content.data) {
        content.source = 'net';
        content.data = await thisModule.loadPageContentFromNet(year, page);
        thisModule.saveContentToCacheFile(cacheFile, content.data);
    }

    return content;
}


function displayYear(year, content, issues) {
    console.log(`@@@ content for [${year}] loaded from ${content.source}`);

    console.log('Thumbnail images:');
    issues.forEach(function(issue) {
        console.log('  ', issue.ymd, issue.thumbnailImageUrl);
    });
}


async function processYear(page, year) {
    // load page from cache or fetch it
    const content = await thisModule.loadIndexPageContent(year, page);

    // parse index page DOM
    const issues = thisModule.parseIndexPage(content.data);

    if (isProduction()) {
        displayYear(year, content, issues);
    }

    return issues;
}


//--------------------------------------------------------------------------------
//                                   main
//--------------------------------------------------------------------------------


async function run() {
    // create virtual browser environment
    const instance = await thisModule.initBrowserInstance(phantom);

    // create virtual page
    const page = await thisModule.initBrowserPage(instance);

    // fetch and parse index page for current year
    const year = thisModule.getCurrentYear();
    await thisModule.processYear(page, year);

    await instance.exit();
}


//--------------------------------------------------------------------------------
//                                  exports
//--------------------------------------------------------------------------------


exports.run = run;
// for testing
exports.phantom = phantom;
exports.lastPartOfPath = lastPartOfPath;
exports.directoryPartOfPath = directoryPartOfPath;
exports.indexPageUrl = indexPageUrl;
exports.issuePageUrl = issuePageUrl;
exports.cacheFilePath = cacheFilePath;
exports.getCurrentYear = getCurrentYear;
exports.getCurrentTimeMillis = getCurrentTimeMillis;
exports.getFileMtimeMillis = getFileMtimeMillis;
exports.loadContentFromCacheFile = loadContentFromCacheFile;
exports.saveContentToCacheFile = saveContentToCacheFile;
exports.fetchPage = fetchPage;
exports.initBrowserInstance = initBrowserInstance;
exports.initBrowserPage = initBrowserPage;
exports.parseIndexPage = parseIndexPage;
exports.loadPageContentFromNet = loadPageContentFromNet;
exports.loadIndexPageContent = loadIndexPageContent;
exports.processYear = processYear;

