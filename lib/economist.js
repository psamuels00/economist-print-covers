'use strict';

//--------------------------------------------------------------------------------
//                                dependencies
//--------------------------------------------------------------------------------


const ejs = require('ejs');
const fs = require('fs');
const https = require('https');
const JSDOM = require('jsdom').JSDOM;
const mkdirSync = require('node-fs').mkdirSync;


//--------------------------------------------------------------------------------
//                                 this module
//--------------------------------------------------------------------------------


// invoking a function through thisModule ensures a stub is used if defined in a test
const thisModule = this;


//--------------------------------------------------------------------------------
//                                  constants
//--------------------------------------------------------------------------------


const config = {
    economistUrl: 'https://www.economist.com/printedition',
    imagePath: {
        THUMBNAIL: 'print-cover-thumbnail',
        MEDIUM:    '200-width',
        LARGE:     'print-cover-full',
    },
};


//--------------------------------------------------------------------------------
//                            execution environment
//--------------------------------------------------------------------------------


function isTesting() {
    return 'NODE_ENV' in process.env && process.env.NODE_ENV == 'test';
}


//--------------------------------------------------------------------------------
//                               generic support
//--------------------------------------------------------------------------------


function delayedResolve(delay, value) {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(value);
        }, delay);
    });
}


async function throttleAfterFetch() {
    if (!isTesting()) {
        //process.stdout.write('        throttle 1 second...');
        await delayedResolve(1000);
        //console.log(' done');
    }
}


function display() {
    if (!isTesting()) {
        const args = Array.from(arguments);
        console.log(...args);
    }
}


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
        path = `_CACHE/${params.year}-covers.html`;
    } else if (type == 'image') {
        const lcType = params.type.toLowerCase();
        path = `images/${params.year}/${params.ymd}/${lcType}.jpg`;
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
    let content;

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


function saveContentToFile(file, content) {
    const dir = thisModule.directoryPartOfPath(file);
    if (!fs.existsSync(dir)) {
        mkdirSync(dir, 0o777, true);
    }
    fs.writeFileSync(file, content);
}


//--------------------------------------------------------------------------------
//                               page fetch
//--------------------------------------------------------------------------------


async function fetchPage(url) {
    const dom = await JSDOM.fromURL(url);
    const content = dom.serialize();
    return content
}


//--------------------------------------------------------------------------------
//                               image fetch
//--------------------------------------------------------------------------------


async function fetchImage(url) {
    const content = await new Promise((resolve, reject) => {

        https.get(url, function(res) {
            var data = [];
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
//                               parse HTML/DOM
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
        const ymd = thisModule.lastPartOfPath(a.href);
        const thumbnailImageUrl = a.querySelector('img').src;
        const displayDate = cover.querySelector('span.date-display-single').innerHTML;
        issues.push({
            ymd,
            displayDate,
            issuePageUrl: thisModule.issuePageUrl(ymd),
            thumbnailImageUrl,
        });
    });

    return issues;
}


//--------------------------------------------------------------------------------
//                                 process year
//--------------------------------------------------------------------------------


async function loadPageContentFromNet(year) {
    // get url of index page for given year
    const url = thisModule.indexPageUrl(year);

    // fetch executed page content
    const content = await thisModule.fetchPage(url);

    return content;
}


async function loadIndexPageContent(year) {
    const cacheFile = thisModule.cacheFilePath('index', { year });

    const expireSec = year == thisModule.getCurrentYear() ? 24 * 3600: 0;

    let content = {
        source: 'cache',
        data: thisModule.loadContentFromCacheFile(cacheFile, expireSec),
    };

    if (!content.data) {
        content.source = 'net';
        content.data = await thisModule.loadPageContentFromNet(year);
        thisModule.saveContentToFile(cacheFile, content.data);
    }

    return content;
}


async function getImage(year, ymd, thumbnailImageUrl, type, displayDate) {
    const url = thumbnailImageUrl.replace(config.imagePath.THUMBNAIL, config.imagePath[type]);
    const file = thisModule.cacheFilePath('image', { year, ymd, type });
    let isDateDisplayed = false;

    if (! await fs.existsSync(file)) {
        if (displayDate) {
            display(`    ${displayDate}`);
        }
        isDateDisplayed = true;
        display(`        fetch ${type} image`);

        const content = await thisModule.fetchImage(url);
        if (!content || content.toString('ascii', 0, 5) == '<html') {
            console.error(`ERROR loading ${type} image for ${ymd}`);
        } else if (content) {
            thisModule.saveContentToFile(file, content);
        }

        await throttleAfterFetch();
    }

    return { file, isDateDisplayed };
}


async function getIssueImages(year, issue, images) {
    const { ymd, thumbnailImageUrl } = issue;
    let { displayDate } = issue;

    let files = {};
    for (const type of Object.keys(config.imagePath)) {
        const result = await thisModule.getImage(year, ymd, thumbnailImageUrl, type, displayDate)
                      .catch((e) => {display('@@@', e.toString());});
        const { file, isDateDisplayed } = result;
        files[type] = file;
        if (isDateDisplayed) {
            displayDate = undefined;
        }
    }

    if (!(year in images)) {
        images[year] = {};
    };
    images[year][ymd] = { displayDate, files };
}


async function processYear(year, images) {
    // load page from cache or fetch it
    const content = await thisModule.loadIndexPageContent(year);
    display(`index for ${year} loaded from ${content.source}`);

    // parse index page DOM
    const issues = thisModule.parseIndexPage(content.data);

    // load images
    for (const issue of issues) {
        await thisModule.getIssueImages(year, issue, images);
    }

    return issues;
}


async function processYears() {
    let images = {};

    let year = thisModule.getCurrentYear();
    for (; year >= 1997; year--) {
        await thisModule.processYear(year, images);
    }

    return images;
}


//--------------------------------------------------------------------------------
//                             generate index files
//--------------------------------------------------------------------------------


function generateIndexFile(images, templateFile, outputFile) {
    const options = {};
    return new Promise((resolve, reject) => {
        ejs.renderFile(templateFile, { images }, options, function(err, str){
            if (err) throw err;
            thisModule.saveContentToFile(outputFile, str);
            display(`index written to ${outputFile}`);
            resolve();
        });
    }).catch((err) => {
        console.error(`Error rendering template ${templateFile}: ` + err.toString());
    });
}


async function generateIndexFiles(images) {
    await Promise.all([
        thisModule.generateIndexFile(images, 'templates/index.ejs',       'output/index.html'),
        thisModule.generateIndexFile(images, 'templates/index_tight.ejs', 'output/index_tight.html'),
        thisModule.generateIndexFile(images, 'templates/index_min.ejs',   'output/index_min.html'),
    ]);
}


//--------------------------------------------------------------------------------
//                                   main
//--------------------------------------------------------------------------------


async function run() {
    // fetch and parse index page for each year
    const images = await thisModule.processYears();

    // generate index files
    thisModule.generateIndexFiles(images);
}


//--------------------------------------------------------------------------------
//                                  exports
//--------------------------------------------------------------------------------


exports.run = run;
// for testing
//exports.phantom = phantom;
exports.lastPartOfPath = lastPartOfPath;
exports.directoryPartOfPath = directoryPartOfPath;
exports.indexPageUrl = indexPageUrl;
exports.issuePageUrl = issuePageUrl;
exports.cacheFilePath = cacheFilePath;
exports.getCurrentYear = getCurrentYear;
exports.getCurrentTimeMillis = getCurrentTimeMillis;
exports.getFileMtimeMillis = getFileMtimeMillis;
exports.loadContentFromCacheFile = loadContentFromCacheFile;
exports.saveContentToFile = saveContentToFile;
exports.fetchPage = fetchPage;
exports.fetchImage = fetchImage;
exports.parseIndexPage = parseIndexPage;
exports.loadPageContentFromNet = loadPageContentFromNet;
exports.loadIndexPageContent = loadIndexPageContent;
exports.getImage = getImage;
exports.getIssueImages = getIssueImages;
exports.processYear = processYear;
exports.processYears = processYears;
exports.generateIndexFile = generateIndexFile;
exports.generateIndexFiles = generateIndexFiles;

