# The Economist Cover Image Displayer

Copy and make comprehensive index of all Economist cover images.

This program was originally written as a Perl script. A week later, The Economist Web site was majorly updated and the pages have to be interpreted in a javascript/browser environment. This project is a port which now does everything the original Perl script did:

* download cover images for every issue available since 1997
* for each issue, download thumbnail, medium, and large image
* for each year, download and cache the Web page listing available issues
* for the current year, expire the cached page after 24 hours
* generate 3 HTML files that show the thumbnail images for every issue

Since there is no Node execution environment on my hosted Web server, and none on my local machine, there is also support for exeuction in an Ubuntu virtual machine using Vagrant, and transfer of output files to my hosted Web server.  A cron job spins up the vm, executes the program, halts the vm, and then transfers the files.

## Output

Something like the following file structure is created by running this program:

```
    output
      ├── index.html
      ├── index_min.html
      └── index_tight.html
    _CACHE
      ├── 1997-covers.html
      ├── 1998-covers.html
      ├── 1999-covers.html
      :
      └── 2018-covers.html     # expires in 24 hours
    images
      ├── 1997
      │       ...
      ├── 1998
      │       ...
      ├── 1999
      │       ...
      :
      └── 2018
            ├── 2018-01-06
            │     ├── large.jpg
            │     ├── medium.jpg
            │     └── thumbnail.jp
            :
            └── 2018-09-22
                  ├── large.jpg
                  ├── medium.jpg
                  └── thumbnail.jpg
```

## Technologies

The following technologies are used in this project:

Javascript
* Node.js - the main program, using async/await as much as possible
* PhantomJS - virtual browser for executing the page
* JSDom - parsing HTML
* EJS (Embedded Javascript Templates) - for generating index files
* Mocha - testing framework
* Chai - BDD-style assertions
* Sinon - Stubs and spies for testing
* npm - manage dependencies

Other
* git and GitHub - revision control
* Bash - cron job
* Perl - to parse cron job status log
* Vagrant and VirtualBox - for modern node environment
* rsync - transfer files to Web host

