'use strict';

var chai = require('chai');
var economist = require('../lib/economist.js');
var expect = chai.expect;
var fs = require('fs');
var rimraf = require('rimraf');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
chai.use(sinonChai);


//--------------------------------------------------------------------------------
//                               config/constants
//--------------------------------------------------------------------------------


const sampleIndexUrl = 'https://www.economist.com/printedition/covers?'
                     + 'date_filter%5Bvalue%5D%5Byear%5D=2018&print_region=76980';
const imgUrlBase = 'https://www.economist.com/sites/default/files/imagecache/print-cover-thumbnail/print-covers';
const sampleContent = `
    <div class="views-print-cover">
        <a href="/path/2018-09-15"><img src="${imgUrlBase}/20180915_cuk400hires.jpg" /></a>
        <div><span class="date-display-single">Sep 15 2018</span></div>
    </div>
    <div class="views-print-cover">
        <a href="/path/2018-09-08"><img src="${imgUrlBase}/20180908_cuk400.jpg" /></a>
        <div><span class="date-display-single">Sep 8 2018</span></div>
    </div>
    <div class="views-print-cover">
        <a href="/path/2018-09-01"><img src="${imgUrlBase}/20180901_cna400.jpg" /></a>
        <div><span class="date-display-single">Sep 1 2018</span></div>
    </div>
`;

const thumbnailImageUrl = 'https://www.economist.com/sites/default/files/imagecache/print-cover-thumbnail/'
                        + 'print-covers/20180922_cuk400.jpg';
const sampleImageContent = new Buffer([1, 2, 3, 4, 16]);

const rootPath = __dirname + '/sample';

before(function() {
    rimraf.sync(rootPath);
});


//--------------------------------------------------------------------------------
//                               generic support
//--------------------------------------------------------------------------------


describe('Generic support functions', function() {
    describe('lastPartOfPath() function', async function() {
        let spy;
        before(function() {
             spy = sinon.spy(economist, 'lastPartOfPath');
        });
        it('should return empty string given empty string', async function() {
            expect(economist.lastPartOfPath('')).to.equal('');
        });
        it('should return empty string given no slash', async function() {
            expect(economist.lastPartOfPath('2018-09-05')).to.equal('');
        });
        it('should return last part of trivial path', async function() {
            expect(economist.lastPartOfPath('/2018-09-05')).to.equal('2018-09-05');
        });
        it('should return last part of long path', async function() {
            expect(economist.lastPartOfPath('something/or/other/2018-09-05')).to.equal('2018-09-05');
        });
        it('should be called 4 times', async function() {
            expect(spy.callCount).to.equal(4);
        });
        after(async function() {
            await economist.lastPartOfPath.restore();
        });
    });

    describe('directoryPartOfPath() function', function() {
        it('should return empty string given empty string', function() {
            expect(economist.directoryPartOfPath('')).to.equal('');
        });
        it('should return empty string given no slash', function() {
            expect(economist.directoryPartOfPath('2018-09-05')).to.equal('');
        });
        it('should return root for trivial absolute path', function() {
            expect(economist.directoryPartOfPath('/2018-09-05')).to.equal('/');
        });
        it('should return all except last part of long absolute path', function() {
            expect(economist.directoryPartOfPath('/something/or/other/2018-09-05')).to.equal('/something/or/other');
        });
        it('should return all except last part of long relative path', function() {
            expect(economist.directoryPartOfPath('something/or/other/2018-09-05')).to.equal('something/or/other');
        });
    });

    describe('indexPageUrl() function', function() {
        it('should encode parameters', function() {
            expect(economist.indexPageUrl(2018)).to.equal(sampleIndexUrl);
        });
    });

    describe('cacheFilePath() function', function() {
        it('should return a valid path for an index page', function() {
            expect(economist.cacheFilePath('index', { year: 2018 })).to.equal('_CACHE/2018-covers.html');
        });
        it('should return a valid path for a thumbnail image', function() {
            const params = { year: 2018, ymd: '2018-09-01', type: 'THUMBNAIL' };
            expect(economist.cacheFilePath('image', params)).to.equal('images/2018/2018-09-01/thumbnail.jpg');
        });
    });

    describe('getCurrentYear() function', function() {
        let clock;
        before(function() {
            clock = sinon.useFakeTimers(new Date('2018-09-12'));
        });
        it('should return the current year, as if it is 2018', async function() {
            expect(economist.getCurrentYear()).to.equal(2018);
        });
        it('should return last year', async function() {
            clock.tick(-365 * 24 * 60 * 60 * 1000);
            expect(economist.getCurrentYear()).to.equal(2017);
        });
        after(async function() {
            await clock.restore();
        });
    });

    describe('getCurrentTimeMillis() function', async function() {
        let clock;
        before(function() {
            clock = sinon.useFakeTimers(0);
        });
        it('should return the current time in milliseconds', async function() {
            expect(economist.getCurrentTimeMillis()).to.equal(0);
        });
        it('should return the current time in milliseconds after 23ms', async function() {
            clock.tick(23);
            expect(economist.getCurrentTimeMillis()).to.equal(23);
        });
        after(async function() {
            await clock.restore();
        });
    });

    describe('getFileMtimeMillis() function', function() {
        const file = '_CACHE/this/file/does/not/exist';
        let statSyncStub;
        before(function() {
            statSyncStub = sinon.stub(fs, 'statSync');
        });
        it('should return undefined for a non-existent file', function() {
            expect(economist.getFileMtimeMillis(file)).to.be.undefined
        });
        it('should throw an error if the stat has no mtimeMs property', function() {
            statSyncStub.returns({});
            expect(() => {
                economist.getFileMtimeMillis(file);
            }).to.throw('has no \'mtimeMs\'');
        });
        it('should throw an error if the stat has an empty mtimeMs property', function() {
            statSyncStub.returns({ mtimeMs: '' });
            expect(() => {
                economist.getFileMtimeMillis(file);
            }).to.throw('has empty \'mtimeMs\'');
        });
        it('should throw an error if the stat has a zero mtimeMs property', function() {
            statSyncStub.returns({ mtimeMs: 0 });
            expect(() => {
                economist.getFileMtimeMillis(file);
            }).to.throw('has zero \'mtimeMs\'');
        });
        it('should throw an error if the stat has an invalid mtimeMs property', function() {
            statSyncStub.returns({ mtimeMs: 'err' });
            expect(() => {
                economist.getFileMtimeMillis(file);
            }).to.throw('has invalid \'mtimeMs\'');
        });
        it('should return the last modification time of a file in milliseconds', async function() {
            await fs.statSync.restore();
            expect(economist.getFileMtimeMillis(__filename)).to.be.gt(1536796800000);
        });
    });
});


//--------------------------------------------------------------------------------
//                               cache files
//--------------------------------------------------------------------------------


describe('Cache file functions', function() {
    const path = rootPath + '/path/tmpfile.$$$';
    const file = __dirname + '/tmpfile.$$$';
    const content1 = 'content1';
    const content2 = 'content2';

    describe('saveContentToFile() function', async function() {
        before(function() {
            rimraf.sync(file);
        });

        it('should write contents to file in existing directory', function() {
            economist.saveContentToFile(file, content1);
            expect(fs.existsSync(file)).is.true;
            fs.unlinkSync(file);
        });
        it('should write contents to file in new directory', function() {
            economist.saveContentToFile(path, content1);
            expect(fs.existsSync(path)).is.true;
        });
        it('should overwrite contents of existing file and update mtime', function(done) {
            const mtimeMs1 = economist.getFileMtimeMillis(path);
            setTimeout(function() {
                economist.saveContentToFile(path, content2);
                const mtimeMs2 = economist.getFileMtimeMillis(path);
                expect(mtimeMs2).to.be.above(mtimeMs1);
                done();
            }, 500);
        });
    });

    describe('loadContentFromCacheFile() function', async function() {
        const timeoutSec = 3600 * 24; // one day
        const timeoutMs = timeoutSec * 1000;

        let clock;
        let fileMs
        let getFileMtimeMillisStub;
        before(function() {
            clock = sinon.useFakeTimers((new Date('2018-09-14')).getTime());
            fileMs = Date.now() - timeoutMs + 1;
            getFileMtimeMillisStub = sinon.stub(economist, 'getFileMtimeMillis');
            getFileMtimeMillisStub.returns(fileMs);
        });

        it('should return undefined for a non-existent file', function() {
            expect(economist.loadContentFromCacheFile(file)).to.be.undefined;
        });
        it('should return undefined for a non-existent, expirable file', function() {
            expect(economist.loadContentFromCacheFile(file, 3600)).to.be.undefined;
        });
        it('should return file contents for file not yet expired', async function() {
            expect(economist.loadContentFromCacheFile(path, timeoutSec)).to.equal(content2);
        });
        it('should return undefined for an expired file', async function() {
            clock.tick(1);
            expect(economist.loadContentFromCacheFile(path, timeoutSec)).to.be.undefined;
        });
        it('should return file contents for non-expiring file', function() {
            expect(economist.loadContentFromCacheFile(path)).to.equal(content2);
        });

        after(async function() {
            await clock.restore();
            await economist.getFileMtimeMillis.restore();
        });
    });
});


//--------------------------------------------------------------------------------
//                               fetch page
//--------------------------------------------------------------------------------


describe('Fetch page', async function() {
    describe('fetchPage() function', async function() {
        it('should return the page content', async function() {
            const content = await economist.fetchPage(sampleIndexUrl)
            expect(content).to.be.a('string');
        });
    });
});


//--------------------------------------------------------------------------------
//                                fetch image
//--------------------------------------------------------------------------------


describe('Fetch image', async function() {
    describe('fetchImage() function', async function() {
        it('should return an image file contents', async function() {
            const content = await economist.fetchImage(thumbnailImageUrl)
            expect(content.toString('hex', 0, 6)).to.equal('ffd8ffe00010');
        });
    });
});


//--------------------------------------------------------------------------------
//                               parse HTML/DOM
//--------------------------------------------------------------------------------


describe('Parse HTML/DOM functions', function() {
    describe('parseIndexPage() function', function() {
        it('should return 3 issues', function() {
            const issues = economist.parseIndexPage(sampleContent);
            expect(issues).to.be.an('array').and.to.have.lengthOf(3);
        });
    });
});


//--------------------------------------------------------------------------------
//                                 process year
//--------------------------------------------------------------------------------


describe('Process year functions', function() {
    const year = 2018;
    const ymd = '2018-09-01';
    const type = 'THUMBNAIL';

    let getCurrentYearStub;
    let fetchPageStub;
    let fetchImageStub;
    const cacheFilePathOrig = economist.cacheFilePath;
    before(async function() {
        getCurrentYearStub = sinon.stub(economist, 'getCurrentYear').returns(year);
        fetchPageStub = sinon.stub(economist, 'fetchPage').returns(sampleContent);;
        fetchImageStub = sinon.stub(economist, 'fetchImage').returns(sampleImageContent);
        economist.cacheFilePath = function(...args) {
            return rootPath + '/' + cacheFilePathOrig(...args);
        };
    });

    describe('loadPageContentFromNet() function', async function() {
        it('should return content', async function() {
            const result = await economist.loadPageContentFromNet(year)
            expect(result).to.equal(sampleContent);
        });
    });

    describe('loadIndexPageContent() function', async function() {
        it('should load content from net', async function() {
            const pageContent = await economist.loadIndexPageContent(year);
            expect(pageContent).to.deep.equal({ source: 'net', data: sampleContent });
        });
        it('should store contents to cache', async function() {
            const isFile = fs.existsSync(economist.cacheFilePath('index', { year }));
            expect(isFile).to.be.true;
        });
        it('should load content from cache', async function() {
            const pageContent = await economist.loadIndexPageContent(year);
            expect(pageContent).to.deep.equal({ source: 'cache', data: sampleContent });
        });
    });

    describe('getImage() function', async function() {
        it('should fetch and store image', async function() {
            await economist.getImage(year, ymd, thumbnailImageUrl, type);
            const file = economist.cacheFilePath('image', { year, ymd, type });
            expect(fs.existsSync(file)).to.be.true;
        });
        it('should not fetch image again', async function() {
            const callCount = fetchImageStub.callCount;
            await economist.getImage(year, ymd, thumbnailImageUrl, type);
            expect(fetchImageStub.callCount).to.equal(callCount);
        });
    });

    describe('getIssueImages() function', async function() {
        it('should fetch and save the medium and large images', async function() {
            const issue = { ymd, displayDate: '', thumbnailImageUrl };
            let images = {};
            await economist.getIssueImages(year, issue, images);
            const isThumbnail = fs.existsSync(
                economist.cacheFilePath('image', { year, ymd, type: 'THUMBNAIL' }));
            const isMedium = fs.existsSync(
                economist.cacheFilePath('image', { year, ymd, type: 'MEDIUM' }));
            const isLarge = fs.existsSync(
                economist.cacheFilePath('image', { year, ymd, type: 'LARGE' }));
            expect(isThumbnail && isMedium && isLarge).to.be.true;
        });
    });

    describe('processYear() function', async function() {
        before(function() {
            rimraf.sync(rootPath);
        });

        it('should process year', async function() {
            let images = {};
            const issues = await economist.processYear(year, images);
            expect(issues).to.be.an('array').and.to.have.lengthOf(3);
        });
        it('should create cache files', function() {
            const isThumbnail = fs.existsSync(
                economist.cacheFilePath('image', { year, ymd, type: 'THUMBNAIL' }));
            expect(isThumbnail).to.be.true;
        });
    });

    after(async function() {
        await economist.getCurrentYear.restore();
        await economist.fetchPage.restore();
        economist.cacheFilePath = cacheFilePathOrig;
    });
});


//--------------------------------------------------------------------------------
//                                   cleanup
//--------------------------------------------------------------------------------


after(function() {
    rimraf.sync(rootPath);
});


