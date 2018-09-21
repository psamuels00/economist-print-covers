################################################################################
################################################################################
################################################################################
#######                                                                  #######
#######                      copied verbatim from                        #######
#######                 ~tvlistings/lib/PacificTime.pm                   #######
#######                                                                  #######
################################################################################
################################################################################
################################################################################

package PacificTime;

#-------------------------------------------------------------------------------
#                                dependencies
#-------------------------------------------------------------------------------


use DateTime;


#-------------------------------------------------------------------------------
#                                  private
#-------------------------------------------------------------------------------


my %OFFSET_FOR = (
    PDT => '-0700',
    MDT => '-0600',
    CDT => '-0500',
    EDT => '-0400',
    PST => '-0800',
    MST => '-0700',
    CST => '-0600',
    EST => '-0500',
);


sub PDT_or_PST {
    my ($sec, $min, $hour, $mday, $mon, $year, $wday, $yday, $isdst) = localtime(time);
    return $isdst ? 'PDT' : 'PST';
}


#-------------------------------------------------------------------------------
#                                  public
#-------------------------------------------------------------------------------


sub epoch_to_UTC {
    my ($epoch_sec) = @_;
    my $PxT = PDT_or_PST();
    my $offset = $OFFSET_FOR{$PxT};
    my $seconds = $offset =~ /-.(\d)../ ? $1 * 3600 : 0;
    return $epoch_sec + $seconds;
}


sub epoch_from_UTC {
    my ($epoch_sec) = @_;
    my $offset = $OFFSET_FOR{timezone()};
    my $seconds = $offset =~ /-.(\d)../ ? $1 * 3600 : 0;
    return $epoch_sec - $seconds;
}


sub DateTime_in_PT {
    my ($timestamp) = @_;

    my $dt;

    my ($year, $month, $day, $hour, $minute, $second, $tz_abbrev);
    my $tz_offset;

    if ($timestamp =~ /(....)-(..)-(..) (..):(..):(..) ([PMCE][DS]T)/) {
        ($year, $month, $day, $hour, $minute, $second, $tz_abbrev) = ($1, $2, $3, $4, $5, $6, $7);
        $tz_offset = $OFFSET_FOR{$tz_abbrev};
    }

    if (defined $tz_offset) {
        $dt = DateTime->new(
            year      => $year,
            month     => $month,
            day       => $day,
            hour      => $hour,
            minute    => $minute,
            second    => $second,
            time_zone => $tz_offset,
        );

        my $PxT = PDT_or_PST();
        $dt->set_time_zone($OFFSET_FOR{$PxT});
    }

    return ($dt, $tz_offset);
}


sub parts_in_PT {
    my ($timestamp, $calc_seconds_since) = @_;

    my $parts;

    my ($dt, $tz_offset) = DateTime_in_PT($timestamp);

    if (defined $dt) {
        my $seconds_since;
        if ($calc_seconds_since) {
            my $now = DateTime->now(time_zone => $tz_offset);
            $seconds_since = $now->epoch - $dt->epoch;
        }

        $parts = [ $seconds_since, $dt->ymd, $dt->hour, $dt->minute, $dt->second, $PxT ];
    }

    return $parts;
}


sub epoch_in_PT {
    my ($timestamp) = @_;

    my ($dt, $tz_offset) = DateTime_in_PT($timestamp);
    return defined $dt ? $dt->epoch : 0;
}


1;
