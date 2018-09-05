var dub = require('../index.js').duble;
var expect = require('chai').expect;

describe('Test Suite 1', function(){
    it('should double naught', function() {
        expect(dub(0)).to.equal(0);
    })
    it('should double unit', function() {
        expect(dub(1)).to.equal(2);
    })
    it('should double double', function() {
        expect(dub(2)).to.equal(4);
    })
    it('should double 99', function() {
        expect(dub(99)).to.equal(198);
    })
    it('should double nexted 3', function() {
        expect(dub(dub(3))).to.equal(12);
    })
})
