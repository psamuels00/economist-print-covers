'use strict';

//--------------------------------------------------------------------------------
//                                dependencies
//--------------------------------------------------------------------------------


const config = require('./Config.js');


//--------------------------------------------------------------------------------
//                                  private
//--------------------------------------------------------------------------------


function isTesting() {
    return typeof global.it === 'function';
}


//--------------------------------------------------------------------------------
//                                   public
//--------------------------------------------------------------------------------


function delayedResolve(delay, value) {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(value);
        }, delay);
    });
}


async function throttleAfterFetch() {
    if (!isTesting()) {
        //process.stdout.write('        throttle 1 second...');
        await delayedResolve(1000);
        //console.log(' done');
    }
}


function display() {
    if (!isTesting()) {
        const args = Array.from(arguments);
        console.log(...args);
    }
}


function lastPartOfPath(str) {
    const n = str.lastIndexOf('/');
    return (n >= 0) ? str.substring(n + 1) : '';
}


function directoryPartOfPath(str) {
    const n = str.lastIndexOf('/');
    return (n == 0) ? '/' : (n > 0) ? str.substring(0, n) : '';
}


function indexPageUrl(year) {
    return config.economistUrl + '/covers'
           + '?' + encodeURIComponent('date_filter[value][year]') + '=' + year
           + '&' + 'print_region=76980';
}


function issuePageUrl(ymd) {
    return config.economistUrl + '/' + ymd;
}


function getCurrentYear() {
    return (new Date()).getFullYear();
}


function getCurrentTimeMillis() {
    return Date.now();
}


//--------------------------------------------------------------------------------
//                                  exports
//--------------------------------------------------------------------------------


exports.delayedResolve = delayedResolve;
exports.throttleAfterFetch = throttleAfterFetch;
exports.display = display;
exports.lastPartOfPath = lastPartOfPath;
exports.directoryPartOfPath = directoryPartOfPath;
exports.indexPageUrl = indexPageUrl;
exports.issuePageUrl = issuePageUrl;
exports.getCurrentYear = getCurrentYear;
exports.getCurrentTimeMillis = getCurrentTimeMillis;

