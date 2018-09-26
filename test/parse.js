'use strict';

const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
chai.use(sinonChai);

const config = require('./config.js');
const parse = require('../lib/Parse.js');

describe('Parse HTML/DOM functions', function() {
    describe('parseIndexPage() function', function() {
        it('should return 3 issues', function() {
            const issues = parse.parseIndexPage(config.sampleContent);
            expect(issues).to.be.an('array').and.to.have.lengthOf(3);
        });
    });
});

