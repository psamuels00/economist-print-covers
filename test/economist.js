'use strict';

const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
chai.use(sinonChai);

const rimraf = require('rimraf');
const fs = require('fs');

const cache = require('../lib/Cache.js');
const config = require('./config.js');
const economist = require('../lib/Economist.js');
const fetch = require('../lib/Fetch.js');
const util = require('../lib/Util.js');

before(function() {
    // just in case previous run didn't cleanup at end
    rimraf.sync(config.rootPath);
});

describe('Process year functions', function() {
    const year = 2018;
    const ymd = '2018-09-01';
    const type = 'THUMBNAIL';

    let getCurrentYearStub;
    let fetchPageStub;
    let fetchImageStub;
    const cacheFilePathOrig = cache.cacheFilePath;
    before(async function() {
        getCurrentYearStub = sinon.stub(util, 'getCurrentYear').returns(year);
        fetchPageStub = sinon.stub(fetch, 'fetchPage').returns(config.sampleContent);;
        fetchImageStub = sinon.stub(fetch, 'fetchImage').returns(config.sampleImageContent);
        cache.cacheFilePath = function(...args) {
            return config.rootPath + '/' + cacheFilePathOrig(...args);
        };
    });

    describe('loadPageContentFromNet() function', async function() {
        it('should return content', async function() {
            const result = await economist.loadPageContentFromNet(year);
            expect(result).to.equal(config.sampleContent);
        });
    });

    describe('loadIndexPageContent() function', async function() {
        it('should load content from net', async function() {
            const pageContent = await economist.loadIndexPageContent(year);
            expect(pageContent).to.deep.equal({ source: 'net', data: config.sampleContent });
        });
        it('should store contents to cache', async function() {
            const isFile = fs.existsSync(cache.cacheFilePath('index', { year }));
            expect(isFile).to.be.true;
        });
        it('should load content from cache', async function() {
            const pageContent = await economist.loadIndexPageContent(year);
            expect(pageContent).to.deep.equal({ source: 'cache', data: config.sampleContent });
        });
    });

    describe('getImage() function', async function() {
        it('should fetch and store image', async function() {
            await economist.getImage(year, ymd, config.thumbnailImageUrl, type);
            const file = cache.cacheFilePath('image', { year, ymd, type });
            expect(fs.existsSync(file)).to.be.true;
        });
        it('should not fetch image again', async function() {
            const callCount = fetchImageStub.callCount;
            await economist.getImage(year, ymd, config.thumbnailImageUrl, type);
            expect(fetchImageStub.callCount).to.equal(callCount);
        });
    });

    describe('getIssueImages() function', async function() {
        it('should fetch and save the medium and large images', async function() {
            const issue = { ymd, displayDate: '', thumbnailImageUrl: config.thumbnailImageUrl };
            let images = {};
            await economist.getIssueImages(year, issue, images);
            const isThumbnail = fs.existsSync(
                cache.cacheFilePath('image', { year, ymd, type: 'THUMBNAIL' }));
            const isMedium = fs.existsSync(
                cache.cacheFilePath('image', { year, ymd, type: 'MEDIUM' }));
            const isLarge = fs.existsSync(
                cache.cacheFilePath('image', { year, ymd, type: 'LARGE' }));
            expect(isThumbnail && isMedium && isLarge).to.be.true;
        });
    });

    describe('processYear() function', async function() {
        before(function() {
            rimraf.sync(config.rootPath);
        });

        it('should process year', async function() {
            let images = {};
            const issues = await economist.processYear(year, images);
            expect(issues).to.be.an('array').and.to.have.lengthOf(3);
        });
        it('should create cache files', function() {
            const isThumbnail = fs.existsSync(
                cache.cacheFilePath('image', { year, ymd, type: 'THUMBNAIL' }));
            expect(isThumbnail).to.be.true;
        });
    });

    after(async function() {
        await Promise.all([
            util.getCurrentYear.restore(),
            fetch.fetchPage.restore(),
            fetch.fetchImage.restore(),
        ]);
        cache.cacheFilePath = cacheFilePathOrig;
    });
});

after(function() {
    rimraf.sync(config.rootPath);
});


