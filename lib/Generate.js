'use strict';

//--------------------------------------------------------------------------------
//                                dependencies
//--------------------------------------------------------------------------------


const cache = require('./Cache.js');
const ejs = require('ejs');
const util = require('./Util.js');


//--------------------------------------------------------------------------------
//                                 this module
//--------------------------------------------------------------------------------


// invoking a function through thisModule ensures a stub is used if defined in a test
const thisModule = this;


//--------------------------------------------------------------------------------
//                                   private
//--------------------------------------------------------------------------------


function generateIndexFile(images, templateFile, outputFile) {
    const options = {};
    return new Promise((resolve, reject) => {
        ejs.renderFile(templateFile, { images }, options, function(err, str){
            if (err) throw err;
            cache.saveContentToFile(outputFile, str);
            util.display(`index written to ${outputFile}`);
            resolve();
        });
    }).catch((err) => {
        console.error(`Error rendering template ${templateFile}: ` + err.toString());
    });
}


//--------------------------------------------------------------------------------
//                                   public
//--------------------------------------------------------------------------------


async function generateIndexFiles(images) {
    const names = [ 'index', 'index_tight', 'index_min', 'index_tiny' ];
    await Promise.all(names.map(function(name) {
        return thisModule.generateIndexFile(images, `templates/${name}.ejs`, `output/${name}.html`);
    }));
}


//--------------------------------------------------------------------------------
//                                  exports
//--------------------------------------------------------------------------------


exports.generateIndexFiles = generateIndexFiles;
// for testing
exports.generateIndexFile = generateIndexFile;

