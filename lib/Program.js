'use strict';

//--------------------------------------------------------------------------------
//                                   public
//--------------------------------------------------------------------------------


function getProgramArgs() {
    const args = process.argv;
    const useRemoteImages = args.indexOf('-r', 2) != -1;
    const showHelp = args.indexOf('-h', 2) != -1 || args.indexOf('--help', 2) != -1;

    return { useRemoteImages, showHelp };
}


function showHelp() {
    console.log(`
NAME
    Economist Print Covers

SYNOPSIS
    node index.js [-h] [-r]

DESCRIPTION
    Fetch all available Economist print cover images from The Economist Web site, and
    and generate a comprehensive index of all the print covers on a single page.

    To determine which print cover images are available, a print editions index page is
    fetched from The Economist.  There is a separate page for each year dating back to
    1997.  Every time the program runs, it processes the index page for every year.

    The print editions index pages are cached so that on subsequent calls, the pages
    are loaded from local disk instead of being fetched again.  For the current year,
    the cached file expires after 24 hours to make sure updates are not missed.

    Three cover images are fetched for each available print edition and saved to a
    directory such as the following:

        images/
            2018/
                2018-09-29/
                    thumbnail.jpg
                    mediumm.jpg
                    large.jpg

    The following index files are generated:

        output/
            index.html - the standard index, with date captions for each print cover image
            index_tight.html - images only, no captions
            index_min.html - images only with no space between them
            index_tiny.html - tiny images, 25 pixels wide

    Each index includes a menu of all the indices at top.  The thumbnail image is displayed
    for each print edition and links to the large image.  The medium image is currently not
    used.  By default, the local copy of images are referenced, but there is an option to
    link to the images hosted at The Economist Web site.

OPTIONS
    -h
            Display usage information and exit with code 0.

    -r
            Link to remote images in the generated index files.

EXIT STATUS
    The Economist program exits with one of the following values:

    0    Success
    >0   An error occurred
`);
}


//--------------------------------------------------------------------------------
//                                  exports
//--------------------------------------------------------------------------------


exports.showHelp = showHelp;
exports.getProgramArgs = getProgramArgs;

