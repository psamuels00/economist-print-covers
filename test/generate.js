'use strict';

const chai = require('chai');
const expect = chai.expect;
const sinonChai = require('sinon-chai');
chai.use(sinonChai);

const rimraf = require('rimraf');
const fs = require('fs');

const config = require('./config.js');
const generate = require('../lib/Generate.js');

describe('Generate index file functions', function() {
    const outputPath = config.rootPath + '/output';
    const generateIndexFileOrig = generate.generateIndexFile;

    before(function() {
        rimraf.sync(outputPath);
        generate.generateIndexFile = function(images, templateFile, outputFile) {
            return generateIndexFileOrig(images, templateFile, config.rootPath + '/' + outputFile);
        };
    });

    describe('generateIndexFile() function', function() {
        it('should create an html file', async function() {
            const images = {};
            await generate.generateIndexFile(images, 'templates/index.ejs', 'output/index.html');
            const file = outputPath + '/index.html';
            expect(fs.existsSync(file)).is.true;
            fs.unlinkSync(file);
        });
    });

    describe('generateIndexFiles() function', function() {
        it('should create 4 html files', async function() {
            const images = {};
            await generate.generateIndexFiles(images);
            const isNormal = fs.existsSync(outputPath + '/index.html');
            const isTight = fs.existsSync(outputPath + '/index_tight.html');
            const isMin = fs.existsSync(outputPath + '/index_min.html');
            const isTiny = fs.existsSync(outputPath + '/index_tiny.html');
            expect(isNormal && isTight && isMin && isTiny).to.be.true;
        });
    });

    after(function() {
        generate.generateIndexFile = generateIndexFileOrig;
    });
});

