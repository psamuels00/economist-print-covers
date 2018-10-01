'use strict';

const path = require('path');

const imgUrlBase = 'https://www.economist.com/sites/default/files/imagecache/print-cover-thumbnail/print-covers';

module.exports = {
    sampleIndexUrl:
        'https://www.economist.com/printedition/covers?'
        + 'date_filter%5Bvalue%5D%5Byear%5D=2018&print_region=76980',

    sampleContent: `
        <div class="views-print-cover">
            <a href="/path/2018-09-15"><img src="${imgUrlBase}/20180915_cuk400hires.jpg" /></a>
            <div><span class="date-display-single">Sep 15 2018</span></div>
        </div>
        <div class="views-print-cover">
            <a href="/path/2018-09-08"><img src="${imgUrlBase}/20180908_cuk400.jpg" /></a>
            <div><span class="date-display-single">Sep 8 2018</span></div>
        </div>
        <div class="views-print-cover">
            <a href="/path/2018-09-01"><img src="${imgUrlBase}/20180901_cna400.jpg" /></a>
            <div><span class="date-display-single">Sep 1 2018</span></div>
        </div>
        `,

    thumbnailImageUrl:
        'https://www.economist.com/sites/default/files/imagecache/print-cover-thumbnail/'
        + 'print-covers/20180922_cuk400.jpg',

    sampleImageContent:
        Buffer.from([ 1, 2, 3, 4, 16 ]),

    rootPath:
        path.join(__dirname, 'sample'),
};

