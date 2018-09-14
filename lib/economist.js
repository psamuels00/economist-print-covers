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
    return 'https://www.economist.com/printedition/covers'
           + '?' + encodeURIComponent('date_filter[value][year]') + '=' + year
           + '&' + 'print_region=76980';
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
        const currentMs = getCurrentTimeMillis();
        loadFile = currentMs < expireMs;
    }

    if (loadFile) {
        content = fs.readFileSync(file, 'utf8');
    }

    return content;
}


function saveContentToCacheFile(file, content) {
    const dir = directoryPartOfPath(file);
    if (!fs.existsSync(dir)) {
        mkdirSync(dir, '0777', true);
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


async function loadPageContentFromNet(year, page) {
    // get url of index page for given year
    const url = indexPageUrl(year);

    // fetch executed page content
    const content = await fetchPage(page, url);

    return content;
}


async function loadIndexPageContent(year, page) {
    const cacheFile = cacheFilePath('index', { year: year });

    let expireSec = year == getCurrentYear() ? 24 * 3600: 0;

    let content = {
        source: 'cache',
        data: loadContentFromCacheFile(cacheFile, expireSec),
    };

    if (!content.data) {
        content.source = 'net';
        content.data = await loadPageContentFromNet(year, page);
        saveContentToCacheFile(cacheFile, content.data);
    }

    return content;
}


async function processYear(page, year) {
    // load page from cache or fetch it
    const content = await loadIndexPageContent(year, page);

    console.log(`@@@ content for [${year}] loaded from ${content.source}`);

    // parse index page DOM
    const issues = parseIndexPage(content.data);

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
    const year = getCurrentYear();
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
exports.directoryPartOfPath = directoryPartOfPath;
exports.indexPageUrl = indexPageUrl;
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

