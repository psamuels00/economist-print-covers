var economist = require('../lib/economist.js');
var expect = require('chai').expect;
var sinon = require('sinon');


//--------------------------------------------------------------------------------
//                               generic support
//--------------------------------------------------------------------------------


describe('Test generic support functions', function() {

    describe('Test lastPartOfPath() function', function() {
        const lastPartOfPath = sinon.spy(economist, 'lastPartOfPath');
        it('should return empty string given empty string', function() {
            expect(economist.lastPartOfPath('')).to.equal('');
        });
        it('should return empty string given no slash', function() {
            expect(economist.lastPartOfPath('2018-09-05')).to.equal('');
        });
        it('should return last part of trivial path', function() {
            expect(economist.lastPartOfPath('/2018-09-05')).to.equal('2018-09-05');
        });
        it('should return last part of long path', function() {
            expect(economist.lastPartOfPath('something/or/other/2018-09-05')).to.equal('2018-09-05');
        });
        it('should be called 4 times', function() {
            sinon.assert.callCount(lastPartOfPath, 4);
        });
    });


    describe('Test indexPageUrl() function', function() {
        const indexPageUrl = sinon.spy(economist, 'indexPageUrl');
        it('should encode parameters', function() {
            const url = 'https://www.economist.com/printedition/covers?date_filter%5Bvalue%5D%5Byear%5D=2018&print_region=76980';
            expect(economist.indexPageUrl(2018)).to.equal(url);
        });
        it('should be called 1 time', function() {
            expect(indexPageUrl.calledOnce).to.be.true;
        });
    });

});


//--------------------------------------------------------------------------------
//                        virtual browser - PhantomJS
//--------------------------------------------------------------------------------


describe('Test PhantomJS interface', async function() {

    this.timeout(30000);

    before(function() {
        this.cache = {};
    });

    describe('Test initBrowserInstance() function', async function() {
        it('should create an instance', async function() {
            instance = await economist.initBrowserInstance(economist.phantom);
            expect(instance).to.be.an('object');
            this.cache.instance = instance;
        });
    });

    describe('Test initBrowserPage() function', async function() {
        it('should create a page', async function() {
            const page = await economist.initBrowserPage(this.cache.instance);
            expect(page).to.be.an('object');
            this.cache.page = page;
        });
    });

    describe.skip('Test fetchPage() function', async function() {
        it('should return the page content', async function() {
            const url = 'https://www.economist.com/printedition/covers?date_filter%5Bvalue%5D%5Byear%5D=2018&print_region=76980';
            const content = await economist.fetchPage(this.cache.page, url, 'my page')
            expect(content).to.be.a('string');
        });
    });

    after(async function() {
        await this.cache.instance.exit();
    });

});


//--------------------------------------------------------------------------------
//                               parse HTML/DOM
//--------------------------------------------------------------------------------


describe('Test parse HTML/DOM functions', function() {

    describe('Test parseIndexPage() function', function() {
        it('should return 3 issues', function() {
            const content
                = '<div class="print-cover-image"><a href="/path/2018-09-01"><img src="20180901.jpg" /></a></div>'
                + '<div class="print-cover-image"><a href="/path/2018-09-08"><img src="20180908.jpg" /></a></div>'
                + '<div class="print-cover-image"><a href="/path/2018-09-15"><img src="20180915.jpg" /></a></div>';
            const issues = economist.parseIndexPage(content);
            expect(issues).to.be.an('array').and.to.have.lengthOf(3);
        });
    });

});

