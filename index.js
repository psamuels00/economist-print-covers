// --------------------------------------------------------------------------------
// The Economist Cover Image Displayer
//
// 2018-??-??  Initial script written in Perl, based on fetching and parsing HTML.
// 2018-??-??  One week later, the Economist Web site was upgraded and returned Javascript instead of HTML.
// 2018-09-05  Rewritten using Node.js with Mocha/Chai/Sinon testing
// v0.1.0      set up project structure with sample function and test suite
// v0.2.0      fetch index page for current year and display thumbnail image url for each edition
// v0.3.0      cache index page with daily expiration

const economist = require('./lib/economist.js');
economist.run();

