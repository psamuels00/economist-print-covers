'use strict';

const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
chai.use(sinonChai);

const config = require('./config.js');
const fetch = require('../lib/Fetch.js');

describe('HTTP fetch functions', function() {
    describe('fetchPage() function', async function() {
        it('should return the page content', async function() {
            const content = await fetch.fetchPage(config.sampleIndexUrl)
            expect(content).to.be.a('string');
        });
    });

    describe('fetchImage() function', async function() {
        it('should return an image file contents', async function() {
            const content = await fetch.fetchImage(config.thumbnailImageUrl)
            expect(content.toString('hex', 0, 6)).to.equal('ffd8ffe00010');
        });
    });
});

