'use strict';

const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
chai.use(sinonChai);

const config = require('./config.js');
const util = require('../lib/Util.js');

describe('Generic support functions', function() {
    describe('lastPartOfPath() function', async function() {
        let spy;
        before(function() {
             spy = sinon.spy(util, 'lastPartOfPath');
        });
        it('should return empty string given empty string', async function() {
            expect(util.lastPartOfPath('')).to.equal('');
        });
        it('should return empty string given no slash', async function() {
            expect(util.lastPartOfPath('2018-09-05')).to.equal('');
        });
        it('should return last part of trivial path', async function() {
            expect(util.lastPartOfPath('/2018-09-05')).to.equal('2018-09-05');
        });
        it('should return last part of long path', async function() {
            expect(util.lastPartOfPath('something/or/other/2018-09-05')).to.equal('2018-09-05');
        });
        it('should be called 4 times', async function() {
            expect(spy.callCount).to.equal(4);
            // just testing spy functionality...
            // of course this doesn't increase confidence in lastPartOfPath()
        });
        after(async function() {
            await util.lastPartOfPath.restore();
        });
    });

    describe('directoryPartOfPath() function', function() {
        it('should return empty string given empty string', function() {
            expect(util.directoryPartOfPath('')).to.equal('');
        });
        it('should return empty string given no slash', function() {
            expect(util.directoryPartOfPath('2018-09-05')).to.equal('');
        });
        it('should return root for trivial absolute path', function() {
            expect(util.directoryPartOfPath('/2018-09-05')).to.equal('/');
        });
        it('should return all except last part of long absolute path', function() {
            expect(util.directoryPartOfPath('/something/or/other/2018-09-05')).to.equal('/something/or/other');
        });
        it('should return all except last part of long relative path', function() {
            expect(util.directoryPartOfPath('something/or/other/2018-09-05')).to.equal('something/or/other');
        });
    });

    describe('indexPageUrl() function', function() {
        it('should encode parameters', function() {
            expect(util.indexPageUrl(2018)).to.equal(config.sampleIndexUrl);
        });
    });

    describe('getCurrentYear() function', function() {
        let clock;
        before(function() {
            clock = sinon.useFakeTimers(new Date('2018-09-12'));
        });
        it('should return the current year, as if it is 2018', async function() {
            expect(util.getCurrentYear()).to.equal(2018);
        });
        it('should return last year', async function() {
            clock.tick(-365 * 24 * 60 * 60 * 1000);
            expect(util.getCurrentYear()).to.equal(2017);
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
            expect(util.getCurrentTimeMillis()).to.equal(0);
        });
        it('should return the current time in milliseconds after 23ms', async function() {
            clock.tick(23);
            expect(util.getCurrentTimeMillis()).to.equal(23);
        });
        after(async function() {
            await clock.restore();
        });
    });
});

