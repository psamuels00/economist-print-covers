'use strict';

const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
chai.use(sinonChai);

const rimraf = require('rimraf');
const fs = require('fs');
const path = require('path');

const cache = require('../lib/Cache.js');

describe('Cache file functions', function() {

    describe('private functions', function() {

        describe('cacheFilePath() function', function() {
            it('should return a valid path for an index page', function() {
                expect(cache.cacheFilePath('index', { year: 2018 })).to.equal('_CACHE/2018-covers.html');
            });
            it('should return a valid path for a thumbnail image', function() {
                const params = { year: 2018, ymd: '2018-09-01', type: 'THUMBNAIL' };
                expect(cache.cacheFilePath('image', params)).to.equal('images/2018/2018-09-01/thumbnail.jpg');
            });
        });

        describe('getFileMtimeMillis() function', function() {
            const file = '_CACHE/this/file/does/not/exist';
            let statSyncStub;
            before(function() {
                statSyncStub = sinon.stub(fs, 'statSync');
            });
            it('should return undefined for a non-existent file', function() {
                expect(cache.getFileMtimeMillis(file)).to.be.undefined;
            });
            it('should throw an error if the stat has no mtimeMs property', function() {
                statSyncStub.returns({});
                expect(() => {
                    cache.getFileMtimeMillis(file);
                }).to.throw('has no \'mtimeMs\'');
            });
            it('should throw an error if the stat has an empty mtimeMs property', function() {
                statSyncStub.returns({ mtimeMs: '' });
                expect(() => {
                    cache.getFileMtimeMillis(file);
                }).to.throw('has empty \'mtimeMs\'');
            });
            it('should throw an error if the stat has a zero mtimeMs property', function() {
                statSyncStub.returns({ mtimeMs: 0 });
                expect(() => {
                    cache.getFileMtimeMillis(file);
                }).to.throw('has zero \'mtimeMs\'');
            });
            it('should throw an error if the stat has an invalid mtimeMs property', function() {
                statSyncStub.returns({ mtimeMs: 'err' });
                expect(() => {
                    cache.getFileMtimeMillis(file);
                }).to.throw('has invalid \'mtimeMs\'');
            });
            it('should return the last modification time of a file in milliseconds', async function() {
                await fs.statSync.restore();
                expect(cache.getFileMtimeMillis(__filename)).to.be.gt(1536796800000);
            });
        });

    });

    describe('public functions', function() {
        const filePath = path.join(__dirname, 'path', 'tmpfile.$$$');
        const fileRoot = path.join(__dirname, 'tmpfile.$$$');
        const content1 = 'content1';
        const content2 = 'content2';

        describe('saveContentToFile() function', function() {
            before(function() {
                rimraf.sync(fileRoot);
            });

            it('should write contents to file in existing directory', function() {
                cache.saveContentToFile(fileRoot, content1);
                expect(fs.existsSync(fileRoot)).is.true;
                fs.unlinkSync(fileRoot);
            });
            it('should write contents to file in new directory', function() {
                cache.saveContentToFile(filePath, content1);
                expect(fs.existsSync(filePath)).is.true;
            });
            it('should overwrite contents of existing file and update mtime', function(done) {
                const mtimeMs1 = cache.getFileMtimeMillis(filePath);
                setTimeout(function() {
                    cache.saveContentToFile(filePath, content2);
                    const mtimeMs2 = cache.getFileMtimeMillis(filePath);
                    expect(mtimeMs2).to.be.above(mtimeMs1);
                    done();
                }, 500);
            });
        });

        describe('loadContentFromCacheFile() function', function() {
            const timeoutSec = 3600 * 24; // one day
            const timeoutMs = timeoutSec * 1000;

            let clock;
            let fileMs;
            let getFileMtimeMillisStub;
            before(function() {
                clock = sinon.useFakeTimers((new Date('2018-09-14')).getTime());
                fileMs = Date.now() - timeoutMs + 1;
                getFileMtimeMillisStub = sinon.stub(cache, 'getFileMtimeMillis');
                getFileMtimeMillisStub.returns(fileMs);
            });

            it('should return undefined for a non-existent file', function() {
                expect(cache.loadContentFromCacheFile(fileRoot)).to.be.undefined;
            });
            it('should return undefined for a non-existent, expirable file', function() {
                expect(cache.loadContentFromCacheFile(fileRoot, 3600)).to.be.undefined;
            });
            it('should return file contents for file not yet expired', function() {
                expect(cache.loadContentFromCacheFile(filePath, timeoutSec)).to.equal(content2);
            });
            it('should return undefined for an expired file', function() {
                clock.tick(1);
                expect(cache.loadContentFromCacheFile(filePath, timeoutSec)).to.be.undefined;
            });
            it('should return file contents for non-expiring file', function() {
                expect(cache.loadContentFromCacheFile(filePath)).to.equal(content2);
            });

            after(async function() {
                await clock.restore();
                await cache.getFileMtimeMillis.restore();
            });
        });

    });

});

