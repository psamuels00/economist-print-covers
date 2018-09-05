var economist = require('../lib/economist.js');
var expect = require('chai').expect;

describe('Test Suite 1', function(){
    it('should return 1', function() {
        expect(economist.step1()).to.equal(1);
    });
    it('should return 2', function() {
        expect(economist.step2()).to.equal(2);
    });
    it('should return 3', function() {
        expect(economist.step3()).to.equal(3);
    });
});
