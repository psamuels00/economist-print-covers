#!/usr/bin/perl -w

#-------------------------------------------------------------------------------
#
# summarize.pl - Summarize log files generated by the Economist Covers cron job.
#
# Execute from the command line.  Try -h for help.
#
# Sept 21 2018
# Perrin Samuels
#
#-------------------------------------------------------------------------------


use strict;
use warnings;


#-------------------------------------------------------------------------------
#                                dependencies
#-------------------------------------------------------------------------------


use lib 'lib';
use PacificTime;
use POSIX qw( floor );


#-------------------------------------------------------------------------------
#                                configuration
#-------------------------------------------------------------------------------


use constant DEFAULT_MAX_ENTRIES   => 10;
use constant MAX_HOURS_IN_PROGRESS => 4;


#-------------------------------------------------------------------------------
#                                  constatns
#-------------------------------------------------------------------------------


use constant LOG_PATHS => (
    'log',
    'log_archive'
);


#-------------------------------------------------------------------------------
#                                  usage
#-------------------------------------------------------------------------------


sub usage {
    my ($exit_code) = @_;

    $exit_code = 0 if !defined $exit_code;

    my $prog = $0;
    $prog =~ s/.*\///;

    print "--------------------\n" if $exit_code;

    print <<"EOT";
NAME
    $prog

SYNOPSIS
    $prog [MAX_ENTRIES]

DESCRIPTION
    Summarize log files generated by the Economist Print Covers cron job.  The following
    options are available:

    -h
            Display usage information and exit with code 0.

    MAX_ENTRIES
            Define the the maximum number of log entries to show.  The default is 10.

    We look in the log directory for logs.  If not enough log entries are found in the log
    directory, we look in the log_archive directory.

EXIT STATUS
    The Summarize program exits with one of the following values:

    0    Success
    >0   An error occurred

EOT

    exit $exit_code;
}


#-------------------------------------------------------------------------------
#                                     main
#-------------------------------------------------------------------------------


sub main {
    my $exit_code = 0;

    my ($max_entries) = parse_args();
    summarize_logs('economist', $max_entries);

    exit $exit_code;
}


#-------------------------------------------------------------------------------
#                             program arguments
#-------------------------------------------------------------------------------


sub parse_args {
    my @argv = @ARGV;

    usage() if ("@argv" =~ /-h/);

    my $max_entries = DEFAULT_MAX_ENTRIES;
    my $error = 0;

    while (@argv) {
        my $arg = shift @argv;
        if ($arg =~ /^(\d+)$/) {
            $max_entries = $1;
        } else {
            print STDERR "Error: Unrecognized option '$arg'.  Try -h for help.\n";
            $error = 1;
        }
    }

    exit 1 if $error;

    return ($max_entries);
}


################################################################################
################################################################################
################################################################################
#######                                                                  #######
#######                      copied verbatim from                        #######
#######                   ~tvlistings/lib/Common.pm                      #######
#######                                                                  #######
################################################################################
################################################################################
################################################################################


sub hoursToAmPm {
    my ($hours, $minutes) = @_;

    my $am_pm = 'am';
    my $is_noon = 0;
    my $is_midnight = 0;

    if ($hours == 0) {
        $hours = 12;
        $is_midnight = 1;
    } elsif ($hours == 12 && $minutes == 0) {
        $am_pm = 'pm';
        $is_noon = 1;
    } elsif ($hours == 12) {
        $am_pm = 'pm';
    } elsif ($hours > 12) {
        $hours -= 12;
        $am_pm = 'pm';
    }

    return ($hours, $am_pm, $is_noon, $is_midnight);
}


################################################################################
################################################################################
################################################################################
#######                                                                  #######
#######       the remainder of this file was copied verbatim from        #######
#######                  ~tvlistings/cron/summarize.pl                   #######
#######                                                                  #######
################################################################################
################################################################################
################################################################################


#-------------------------------------------------------------------------------
#                             summarize logs
#-------------------------------------------------------------------------------


sub summarize_logs {
    my $type = shift;
    my $max_entries = shift;
    my $orig_type = shift;

    my @lines;

    my @files = map { "$_/$type.log" } LOG_PATHS;
    my $is_first_entry = 1;

    while (@files && @lines < $max_entries) {
        my $file = shift @files;
        if (-f $file) {
            if (!$is_first_entry) {
                my $only_got = @lines > 0 ? sprintf 'only got %d entries', scalar @lines : 'No entries found';
                printf "    ....$only_got so far for %s logs.  Looking for more in $file\n", uc $type;
            }
            if (open my $fh, '<', $file) {
                parse_and_process_log_file($fh, $file, $max_entries, \@lines);
                close $fh;
            } else {
                print STDERR "Error opening $file for input: $!\n";
            }
        } elsif (!$orig_type) {
            last; # if no type explicitly requested, cancel on the first file not found
        }
        $is_first_entry = 0;
    }

    if (@lines) {
        print uc "$type\n";
        print "$_\n" for @lines;
        print "\n";
    }
}


#-------------------------------------------------------------------------------
#                      parse and process log file
#-------------------------------------------------------------------------------


sub parse_and_process_log_file {
    my ($fh, $file, $max_entries, $lines) = @_;

    my $entries = parse_log_file($fh, $file);
    my $entry_keys = ordered_entry_keys($entries, $max_entries - @$lines);
    unshift @$lines, format_entries($entries, $entry_keys);
}


sub parse_log_file {
    my ($fh, $file) = @_;

    my %entries;
    my $line_num = 0;

    while (my $line = <$fh>) {
        chop $line;
        $line_num += 1;

        # 2018-05-31 14:00:06 CDT pid=3545 status=started seconds=0
        # 2018-05-31 14:00:06 CDT pid=3545 status=success seconds=485
        if ($line =~ /^(\d{4}-\d\d-\d\d \d\d:\d\d:\d\d [CP][SD]T) pid=(\d+) status=(\w+) seconds=(\d+)/) {
            my ($timestamp, $pid, $status, $seconds) = ($1, $2, $3, $4);

            my $key = "$timestamp-$pid";
            if (exists $entries{$key}) {
                $entries{$key}->{seconds} = $seconds;
                $entries{$key}->{status} = $status;
                delete $entries{$key}->{incomplete};
            } else {
                $entries{$key} = {
                    line_num   => $line_num,
                    pid        => $pid,
                    seconds    => $seconds,
                    status     => $status,
                    timestamp  => $timestamp,
                    incomplete => 1,
                };
            }
        }
    }

    return \%entries;
}


sub ordered_entry_keys {
    my ($entries, $max_entries) = @_;

    my @entry_keys = sort {
        $entries->{$a}->{line_num} <=>
        $entries->{$b}->{line_num}
    } keys %$entries;

    if ($max_entries && @entry_keys > $max_entries) {
        @entry_keys = @entry_keys[@entry_keys - $max_entries .. @entry_keys - 1];
    }

    return \@entry_keys;
}


#-------------------------------------------------------------------------------
#                            output format
#-------------------------------------------------------------------------------


sub format_entries {
    my ($entries, $ordered_entry_keys) = @_;

    my @lines;
    foreach my $key (@$ordered_entry_keys) {
        my $entry = $entries->{$key};
        my $timestamp = $entry->{timestamp};
        my $seconds   = $entry->{seconds};
        my $status    = $entry->{status};
        push @lines, time_summary($timestamp, $seconds, $status);
    }

    return @lines;
}


# eg: "2018-05-02  4am    -> 05m 53s    #####....................................................."
# eg: "2018-05-02  4:20am -> 01m 08s    #........"
sub time_summary {
    my $timestamp = shift;   # eg: 2011-01-07 01:11:53 PST
    my $seconds = shift;     # runtime seconds
    my $status = shift;      # one of { started, success, error }

    my $min_sec;
    my $text_bar = '';
    my $seconds_since;

    # modify $timestamp...
    my $calc_seconds_since = $status eq 'started';
    my $parts = PacificTime::parts_in_PT($timestamp, $calc_seconds_since);
    if ($parts) {
        my ($date, $hours, $minutes);
        ($seconds_since, $date, $hours, $minutes) = @$parts;

        my $am_pm;
        ($hours, $am_pm) = hoursToAmPm($hours, $minutes);
        $timestamp = sprintf '%s %2d:%02d%s', $date, $hours, $minutes, $am_pm;
        $timestamp =~ s/:00//;
    }

    # modify $min_sec and initialize $text_bar
    if ($status ne 'started') {
        my $minutes = int($seconds / 60);
        $seconds %= 60;
        $min_sec = sprintf '%02dm %02ds', $minutes, $seconds;
        $text_bar = '#' x $minutes . '.' x $seconds;
        if ($status eq 'error') {
            $text_bar .= (length $text_bar > 0 ? ' ' : '') . 'ERROR';
        }
    } else {
        my ($days, $hours, $minutes, $seconds) = seconds_to_dhms($seconds_since);
        if (($days * 24 + $hours) > MAX_HOURS_IN_PROGRESS) {
            if ($days) {
                $min_sec = sprintf '%02dd %02dh', $days, $hours;
            } else {
                $min_sec = sprintf '%02dh %02dm', $hours, $minutes;
            }
            $text_bar = '(*** APPARENTLY UNENDING ***)';
        } else {
            if ($hours) {
                $min_sec = sprintf '%02dh %02dm', $hours, $minutes;
                if ($hours > 10) {
                    $text_bar = '>' x $hours . ' (*** IN PROGRESS ***)';
                } else {
                    $text_bar = '>' x $hours . '#' x $minutes . ' (*** IN PROGRESS ***)';
                }
            } else {
                $min_sec = sprintf '%02dm %02ds', $minutes, $seconds;
                if ($minutes > 10) {
                    $text_bar = '#' x $minutes . ' (*** IN PROGRESS ***)';
                } else {
                    $text_bar = '#' x $minutes . '.' x $seconds . ' (*** IN PROGRESS ***)';
                }
            }
        }
    }

    return sprintf '%-18s -> %s    %s', $timestamp, $min_sec, $text_bar;
}


sub seconds_to_dhms {
    my ($seconds) = @_;

    my $days = int($seconds / 60 / 60 / 24);
    $seconds %= 60 * 60 * 24;
    my $hours = int($seconds / 60 / 60);
    $seconds %= 60 * 60;
    my $minutes = int($seconds / 60);
    $seconds %= 60;

    return ($days, $hours, $minutes, $seconds);
}


#-------------------------------------------------------------------------------
#                                     main
#-------------------------------------------------------------------------------


main();

