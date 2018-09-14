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
            await spy.restore();
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
            const url = 'https://www.economist.com/printedition/covers?date_filter%5Bvalue%5D%5Byear%5D=2018&print_region=76980';
            expect(economist.indexPageUrl(2018)).to.equal(url);
        });
    });

    describe('cacheFilePath() function', function() {
        it('should return a valid path for an index page', function() {
            expect(economist.cacheFilePath('index', { year: 2018 })).to.equal('_CACHE/2018/index.html');
        });
        it('should return a valid path for an issue page');
        it('should return a valid path for an image');
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
            await statSyncStub.restore();
            expect(economist.getFileMtimeMillis(__filename)).to.be.gt(1536796800000);
        });
    });
});


//--------------------------------------------------------------------------------
//                               cache files
//--------------------------------------------------------------------------------


describe('Cache file functions', function() {
    const root = __dirname + '/sample';
    const path = root + '/path/tmpfile.$$$';
    const file = __dirname + '/tmpfile.$$$';
    const content1 = 'content1';
    const content2 = 'content2';

    before(function() {
        rimraf.sync(root);
        rimraf.sync(file);
    });

    describe('saveContentToCacheFile() function', async function() {
        it('should write contents to file in existing directory', function() {
            economist.saveContentToCacheFile(file, content1);
            expect(fs.existsSync(file)).is.true;
            fs.unlinkSync(file);
        });
        it('should write contents to file in new directory', function() {
            economist.saveContentToCacheFile(path, content1);
            expect(fs.existsSync(path)).is.true;
        });
        it('should overwrite contents of existing file and update mtime', function(done) {
            const mtimeMs1 = economist.getFileMtimeMillis(path);
            setTimeout(function() {
                economist.saveContentToCacheFile(path, content2);
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
            await getFileMtimeMillisStub.restore();
        });
    });

    after(async function() {
        rimraf.sync(root);
    });
});


//--------------------------------------------------------------------------------
//                        virtual browser - PhantomJS
//--------------------------------------------------------------------------------


describe('PhantomJS interface', async function() {
    this.timeout(30000);

    let cache;
    before(async function() {
        cache = {};
    });

    describe('initBrowserInstance() function', async function() {
        it('should create an instance', async function() {
            const instance = await economist.initBrowserInstance(economist.phantom);
            expect(instance).to.be.an('object');
            cache.instance = instance;
        });
    });

    describe('initBrowserPage() function', async function() {
        it('should create a page', async function() {
            const page = await economist.initBrowserPage(cache.instance);
            expect(page).to.be.an('object');
            cache.page = page;
        });
    });

    describe('fetchPage() function', async function() {
        it('should return the page content', async function() {
            const url = 'https://www.economist.com/printedition/covers?date_filter%5Bvalue%5D%5Byear%5D=2018&print_region=76980';
            const content = await economist.fetchPage(cache.page, url, 'my page')
            expect(content).to.be.a('string');
        });
    });

    after(async function() {
        await cache.instance.exit();
    });
});


//--------------------------------------------------------------------------------
//                               parse HTML/DOM
//--------------------------------------------------------------------------------


describe('Parse HTML/DOM functions', function() {
    describe('parseIndexPage() function', function() {
        it('should return 3 issues', async function() {
            const content
                = '<div class="print-cover-image"><a href="/path/2018-09-01"><img src="20180901.jpg" /></a></div>'
                + '<div class="print-cover-image"><a href="/path/2018-09-08"><img src="20180908.jpg" /></a></div>'
                + '<div class="print-cover-image"><a href="/path/2018-09-15"><img src="20180915.jpg" /></a></div>';
            const issues = economist.parseIndexPage(content);
            expect(issues).to.be.an('array').and.to.have.lengthOf(3);
        });
    });
});

