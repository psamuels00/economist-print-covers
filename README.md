# The Economist Print Covers

Fetch all available print cover images from The Economist Web site and generate
a comprehensive index of all the print covers on a single page.  See sample
generated files [here](examples/).

* [How it works](#how-it-works)
* [Motivation](#motivation)
* [Technologies](#technologies)
* [Installation](#installation)
* [Options](#options)

## How it works

To determine which print cover images are available, a print editions index page
is fetched from The Economist.  There is a separate page for each year dating back
to 1997.  Every time the program runs, it processes the index page for every year.

The print editions index pages are cached so that on subsequent calls, the pages
are loaded from local disk instead of being fetched again.  For the current year,
the cached file expires after 24 hours to make sure updates are not missed.  The
cache looks like this:

        _CACHE
          ├── 1997-covers.html
          ├── 1998-covers.html
          ├── 1999-covers.html
          :
          └── 20??-covers.html   # expires in 24 hours

##### Saved images

For each available print edition, 3 different sizes of the cover image are
fetched and saved to an `images` directory.  For example:

        images
          └── 2018
                └── 2018-09-22
                      ├── large.jpg
                      ├── medium.jpg
                      └── thumbnail.jpg

##### Generated index files
After all the print editions index pages are processed (ie, for every available year),
the following set of index files are generated or overwritten:

        output
          ├── index.html       - date is shown below each print edition cover
          ├── index_tight.html - images only, no labels
          ├── index_min.html   - images only with no space between them
          └── index_tiny.html  - tiny images, 25 pixels wide

The generated index files are comprehensive in that each displays the thumbnail cover
image for every print edition that is available.  The thumbnail image is presented as
a link to the large image.  The medium image is currently not used.  By default, the
local copy of images in the `images` directory are referenced, but there is an option
for referencing the remote images, the source of local images, as well.

The generated index files differ in how "compactly" the cover images are displayed,
but are essentially otherwise the same.  At the top of each index is a simple menu
to allow easy navigation between the variations.

## Motivation

![The Economist Wall][http://lsatruler.com/the_economist/EconomistWall.jpg]

I love [The Economist](http://economist.com).
Years ago I installed an Economist mural in my living room, made from a selection of
print covers I've been saving for years.  Due to limited space, it was hard to visualize the entire mural
at once before settling on a design and hanging up all the selected covers.  Then it was hard to change,
either the selection or position of covers.  I've since replaced the Economist mural with something else
(Häagen Dazs lids!), but still saving Economist print covers with the aim of making another mural again
in the future.

The next time I make an Economist mural, I want it to be easier to design.  Instead of dealing directly
with the physical printer covers and wall, I will instead manipulate images of the print covers on
my computer.  This way I can see the whole thing at once and easily make adjustments before it is
completed and installed.

I noticed one day that images for all the print covers (going back to 1997) are available at The Economist
Web site.  Instead of taking pictures of all my print covers and then making thumbnail images of them to
manipulate on screen, I am instead scraping the images from The Economist.

This program was originally written as a simple Perl script as the HTML served up by the Economist Web
site was easily parsed HTML.  A week later (!!), the Web site was majorly updated, after which a big
ol' &lt;script> tag is returned instead of HTML.  This project is a port of the original Perl script,
but using Javascript so that the page can be "executed" as a Web browser would.  It is also an
opportunity for the author to get more familiar with GitHub, JSDom, and Javascript testing.

## Technologies

This project is mostly Javascript-based, using ES6 with Node.js and npm for package management.
Development is done in Ubuntu through a VirtualBox virtual machine managed by Vagrant.  Ruby
is used technically, but only for the Vagrant config file, which is pretty much declarative.
Bash is used for provisioning the virtual machine, and also for automation as a cron job.  The
cron job generates logs and Perl is used to parse and summarize the logs.  A summary follows:

Javascript
* Node.js - the main program, using async/await as much as possible
* npm - manage project dependencies
* JSDom - "execute" page and parse HTML
* EJS (Embedded Javascript Templates) - generate index files

Javascript - for testing
* ESLint - validate Javascript code
* Mocha - testing framework
* Chai - BDD-style assertions
* Sinon - stubs and spies

Development Environment
* git and GitHub - revision control and project mgmt
* Ubuntu 16.04 - for modern node environment
* Vagrant and VirtualBox - manage Ubuntu virtual machine

Automation
* Bash - cron job
* Perl - parse cron job status log
* rsync - transfer files to another host

## Installation

You will need to have Virtual Box and Vagrant already installed.  To get started,
execute the following from the project directory:

    `vagrant up`

This will spin up and provision the virtual machine.  Provisioning includes updating
and installing several packages on the guest machine.  It also configures the Bash
prompt and vi editor settings for the default user (vagrant) and root using files in
the `vagrant-files` directory.  After provisioning is complete, sign into the guest
machine as follows:

    `vagrant ssh`

This lands you in the `/vagrant` directory, which is synced with the project
directory on the host machine.  Next, install all the Node project dependcies:

    `npm install`

To run the tests:

    `npm test`, or
    `mocha`

To run the program:

    `npm start`, or
    `node index`

To log out of the guest machine and shut it down:

    `exit`
    `vagrant halt`

All the images are now in the `images` directory, and the generated, consolidated index
files are in the `output` directory.  To load the index on a Mac, try this:

    `open output/index.html`

##### Automation

Since a new print edition becomes available each week, you can capture new images automatically
by scheduling a weekly cron job.  This assumes your host machine is Unix based...

For my particular situation, the fetched images and generated index files are made available
through an external hosting service, where Node is not available and there is no support for
a virtual machine.  Therefore, the cron job must run locally for me.  Since the virtual
machine may not be running, the cron job is scheduled on my host machine.  The crontab entry
looks like this:

````
# check for new Economist cover images and update index files weekly on Friday at 2am
0 2 * * 5 /Users/perrin/save/data/projects/economist/cron/update.sh
````

This script will execute our Node program on the guest machine and then transfer
newly fetched images and updated output files to the hosted account.  If the guest
machine is not already running, it will be started at first, and then halted at
the end.  The cron job generates the following files:

        cron
            └── logs
                  ├── economist.output.txt
                  ├── economist.error.txt
                  └── economist.log

The files which capture standard output and standard error output are overwritten
each time the cron job runs.  The status log file is accumulative, tracking each
execution using two lines: one when the job started and another when it ended.
To see a summary of executions, try this:

    `cd cron`
    `./summarize.pl`

The summarize program can be run from the guest or host machine, assuming Perl is
installed on the host.  I set up a Bash function to do this on my host machine by
adding the following to my .bashrc file:

    ````
    econsum () {
        local DIR=~/save/data/projects/economist;
        ( cd $DIR/cron; ./summarize.pl $@ )
    }
    ````

Now to get a summary of the 5 most recent executions, type this from any directory:

    `econsum 5`

This generates output such as the following:

    ````
    ECONOMIST
    2018-09-07  2am    -> 03m 03s    ###...
    2018-09-14  2am    -> 03m 14s    ###..............ERROR
    2018-09-21  2am    -> 03m 24s    ###........................
    2018-09-28  2am    -> 02m 05s    ##.....
    2018-10-05  2am    -> 01m 05s    #.....
    ````

Each `#` represents a minute, each `.` represents a second.

**Notice**: You will probably want to modify the cron job, update.sh, to suit your needs.  At a minimum,
you will need to update paths to match the location of your project directory and credentials
credentials for transferring files to a hosted service.

## Options

There is only one option at this time:

    `node index.js -r`

When the 'remote' option is included, references in the generated index files are made to
the original (remote) images hosted by The Economist rather than the copies (local) that
are fetched.  This option was added to generate index pages that will work from anywhere,
even without a local copy of all the images.  This option was enabled to generate the
index files in the `examples/` directory.

