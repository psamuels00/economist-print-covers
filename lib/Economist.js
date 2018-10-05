'use strict';

//--------------------------------------------------------------------------------
//                                dependencies
//--------------------------------------------------------------------------------


const cache = require('./Cache.js');
const config = require('./Config.js');
const fetch = require('./Fetch.js');
const generate = require('./Generate.js');
const fs = require('fs');
const parse = require('./Parse.js');
const util = require('./Util.js');


//--------------------------------------------------------------------------------
//                                 this module
//--------------------------------------------------------------------------------


// invoking a function through thisModule ensures a stub is used if defined in a test
const thisModule = this;


//--------------------------------------------------------------------------------
//                                   private
//--------------------------------------------------------------------------------


async function loadPageContentFromNet(year) {
    // get url of index page for given year
    const url = util.indexPageUrl(year);

    // fetch executed page content
    const content = await fetch.fetchPage(url);

    return content;
}


async function loadIndexPageContent(year) {
    const cacheFile = cache.cacheFilePath('index', { year });

    const expireSec = year == util.getCurrentYear() ? 24 * 3600: 0;

    let content = {
        source: 'cache',
        data: cache.loadContentFromCacheFile(cacheFile, expireSec),
    };

    if (!content.data) {
        content.source = 'net';
        content.data = await thisModule.loadPageContentFromNet(year);
        cache.saveContentToFile(cacheFile, content.data);
    }

    return content;
}


async function getImage(year, ymd, thumbnailImageUrl, type, displayDate) {
    const url = thumbnailImageUrl.replace(config.imagePath.THUMBNAIL, config.imagePath[type]);
    const file = cache.cacheFilePath('image', { year, ymd, type });
    let isDateDisplayed = false;

    if (! await fs.existsSync(file)) {
        if (displayDate) {
            util.display(`    ${displayDate}`);
        }
        isDateDisplayed = true;
        util.display(`        fetch ${type} image`);

        const content = await fetch.fetchImage(url);
        if (!content || content.toString('ascii', 0, 5) == '<html') {
            console.error(`ERROR loading ${type} image for ${ymd}`);
        } else if (content) {
            cache.saveContentToFile(file, content);
        }

        await util.throttleAfterFetch();
    }

    return { file, url, isDateDisplayed };
}


async function getIssueImages(year, issue, images, useRemoteImages) {
    const { ymd, thumbnailImageUrl } = issue;
    let { displayDate } = issue;

    let urls = {};
    for (const type of Object.keys(config.imagePath)) {
        const result = await thisModule.getImage(year, ymd, thumbnailImageUrl, type, displayDate)
                      .catch((e) => {util.display('@@@', e.toString());});
        const { file, url, isDateDisplayed } = result;
        urls[type] = useRemoteImages ? url : file;
        if (isDateDisplayed) {
            displayDate = undefined;
        }
    }

    if (!(year in images)) {
        images[year] = {};
    }
    images[year][ymd] = { displayDate, urls };
}


async function processYear(year, images, useRemoteImages) {
    // load page from cache or fetch it
    const content = await thisModule.loadIndexPageContent(year);
    util.display(`index for ${year} loaded from ${content.source}`);

    // parse index page DOM
    const issues = parse.parseIndexPage(content.data);

    // load images
    for (const issue of issues) {
        await thisModule.getIssueImages(year, issue, images, useRemoteImages);
    }

    return issues;
}


async function processYears(useRemoteImages) {
    let images = {};

    let year = util.getCurrentYear();
    for (; year >= config.firstAvailableYear; year--) {
        await thisModule.processYear(year, images, useRemoteImages);
    }

    return images;
}


//--------------------------------------------------------------------------------
//                                   public
//--------------------------------------------------------------------------------


async function run(useRemoteImages) {
    // fetch and parse index page for each year
    const images = await thisModule.processYears(useRemoteImages);

    // generate index files
    generate.generateIndexFiles(images);
}


//--------------------------------------------------------------------------------
//                                  exports
//--------------------------------------------------------------------------------


exports.run = run;
// for testing
exports.loadPageContentFromNet = loadPageContentFromNet;
exports.loadIndexPageContent = loadIndexPageContent;
exports.getImage = getImage;
exports.getIssueImages = getIssueImages;
exports.processYear = processYear;
exports.processYears = processYears;

