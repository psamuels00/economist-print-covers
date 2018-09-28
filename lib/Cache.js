'use strict';

//--------------------------------------------------------------------------------
//                                dependencies
//--------------------------------------------------------------------------------


const fs = require('fs');
const mkdirSync = require('node-fs').mkdirSync;
const util = require('./Util.js');


//--------------------------------------------------------------------------------
//                                 this module
//--------------------------------------------------------------------------------


// invoking a function through thisModule ensures a stub is used if defined in a test
const thisModule = this;


//--------------------------------------------------------------------------------
//                                  private
//--------------------------------------------------------------------------------


function getFileMtimeMillis(file) {
    let millis;
    let stat;
    try {
        stat = fs.statSync(file);
    } catch(e) {
        stat = undefined;
    }

    if (stat == undefined) {
        //nop
    } else if (!('mtimeMs' in stat)) {
        throw new Error(`stat for ${file} has no 'mtimeMs'`);
    } else if (stat.mtimeMs.length == 0) {
        throw new Error(`stat for ${file} has empty 'mtimeMs'`);
    } else if (stat.mtimeMs == 0) {
        throw new Error(`stat for ${file} has zero 'mtimeMs'`);
    } else if (! (new String(stat.mtimeMs)).match(/^\d+$/)) {
        throw new Error(`stat for ${file} has invalid 'mtimeMs'`);
    } else {
        millis = stat.mtimeMs;
    }

    return millis;
}


//--------------------------------------------------------------------------------
//                                   public
//--------------------------------------------------------------------------------


function cacheFilePath(type, params) {
    let path;

    if (type == 'index') {
        path = `_CACHE/${params.year}-covers.html`;
    } else if (type == 'image') {
        const lcType = params.type.toLowerCase();
        path = `images/${params.year}/${params.ymd}/${lcType}.jpg`;
    }

    return path;
}


function loadContentFromCacheFile(file, expireSec) {
    let content;

    let loadFile = true;

    if (!fs.existsSync(file)) {
        loadFile = false;
    } else if (expireSec) {
        const fileMs = thisModule.getFileMtimeMillis(file);
        const expireMs = fileMs + expireSec * 1000;
        const currentMs = util.getCurrentTimeMillis();
        loadFile = currentMs < expireMs;
    }

    if (loadFile) {
        content = fs.readFileSync(file, 'utf8');
    }

    return content;
}


function saveContentToFile(file, content) {
    const dir = util.directoryPartOfPath(file);
    if (!fs.existsSync(dir)) {
        mkdirSync(dir, 0o777, true);
    }
    fs.writeFileSync(file, content);
}


//--------------------------------------------------------------------------------
//                                  exports
//--------------------------------------------------------------------------------


exports.cacheFilePath = cacheFilePath;
exports.loadContentFromCacheFile = loadContentFromCacheFile;
exports.saveContentToFile = saveContentToFile;
// for testing
exports.getFileMtimeMillis = getFileMtimeMillis;

