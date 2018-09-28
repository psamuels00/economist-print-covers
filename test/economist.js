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

    let fetchImageStub;
    const cacheFilePathOrig = cache.cacheFilePath;
    before(function() {
        sinon.stub(util, 'getCurrentYear').returns(year);
        sinon.stub(fetch, 'fetchPage').returns(config.sampleContent);
        fetchImageStub = sinon.stub(fetch, 'fetchImage').returns(config.sampleImageContent);
        cache.cacheFilePath = function(...args) {
            return config.rootPath + '/' + cacheFilePathOrig(...args);
        };
    });

    describe('loadPageContentFromNet() function', function() {
        it('should return content', async function() {
            const result = await economist.loadPageContentFromNet(year);
            expect(result).to.equal(config.sampleContent);
        });
    });

    describe('loadIndexPageContent() function', function() {
        it('should load content from net', async function() {
            const pageContent = await economist.loadIndexPageContent(year);
            expect(pageContent).to.deep.equal({ source: 'net', data: config.sampleContent });
        });
        it('should store contents to cache', function() {
            const isFile = fs.existsSync(cache.cacheFilePath('index', { year }));
            expect(isFile).to.be.true;
        });
        it('should load content from cache', async function() {
            const pageContent = await economist.loadIndexPageContent(year);
            expect(pageContent).to.deep.equal({ source: 'cache', data: config.sampleContent });
        });
    });

    describe('getImage() function', function() {
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

    describe('getIssueImages() function', function() {
        it('should fetch and save the medium and large images', async function() {
            const issue = { ymd, displayDate: '', thumbnailImageUrl: config.thumbnailImageUrl };
            let images = {};
            await economist.getIssueImages(year, issue, images);

            let isFile = {};
            for (let ucType of [ 'THUMBNAIL', 'MEDIUM', 'LARGE' ]) {
                const file = cache.cacheFilePath('image', { year, ymd, type: ucType });
                isFile[ucType] = fs.existsSync(file);
            }
            expect(isFile.THUMBNAIL && isFile.MEDIUM && isFile.LARGE).to.be.true;
        });
    });

    describe('processYear() function', function() {
        before(function() {
            rimraf.sync(config.rootPath);
        });

        it('should process year', async function() {
            let images = {};
            const issues = await economist.processYear(year, images);
            expect(issues).to.be.an('array').and.to.have.lengthOf(3);
        });
        it('should create cache files', function() {
            const file = cache.cacheFilePath('image', { year, ymd, type: 'THUMBNAIL' });
            const isThumbnail = fs.existsSync(file);
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


