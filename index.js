// --------------------------------------------------------------------------------
// The Economist Cover Image Displayer
//
// 2018-??-??  Initial script written in Perl, based on fetching and parsing HTML.
// 2018-??-??  One week later, the Economist Web site was upgraded and returned Javascript instead of HTML.
// 2018-09-05  Rewritten using Node.js with Mocha/Chai/Sinon testing
// v0.1.0      set up project structure with sample function and test suite
// v0.2.0      fetch index page for current year and display thumbnail image url for each issue
// v0.3.0      cache index page with daily expiration
// v0.4.0      fetch images for each issue
// v0.5.0      generate index pages
// v0.6.0      load all years
// v0.7.0      create cron job and log file summarizer
// v0.7.1      update README markdown
// v0.8.0      replace phantom with jsdom

const economist = require('./lib/economist.js');
economist.run();

