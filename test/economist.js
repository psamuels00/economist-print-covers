var economist = require('../lib/economist.js');
var expect = require('chai').expect;

describe('Test Suite 1', function(){
    it('should return empty string', function() {
        expect(economist.ymdAtEot('')).to.equal('');
    });
    it('should return a date 1', function() {
        expect(economist.ymdAtEot('/2018-09-05')).to.equal('2018-09-05');
    });
    it('should return a date 2', function() {
        expect(economist.ymdAtEot('something/or/other/2018-09-05')).to.equal('2018-09-05');
    });
});
