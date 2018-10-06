# The Economist Print Covers - Automation

This directory contains a couple files of primary interest:

    update.sh
    summarize.pl

The Bash script is intended to be scheduled as a cron job.  For example:

    # check for new Economist cover images and update index files weekly on Friday at 2am
    0 2 * * 5 /Users/perrin/save/data/projects/economist/cron/update.sh

When run, it creates a `log` directory and logs its execution there.  The Perl script
parses the status log file and summarizes executions of the cron job.  The log file
format, Perl script, and dependent Perl library were adapted from a previous project.
Minimal effort was made to port it for use here.

**Caveat**: The  dependent library is designed to work in one of the 4 mainland United
States time zones: Eastern, Central, Mountain, or Pacific Time.  The cron job and
summarizer script should work in any of those time zones.  It has not been tested
with others.

