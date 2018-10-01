#!/bin/bash

# so Vagrant can find VirtualBox
PATH=$PATH:/usr/local/bin

#--------------------------------------------

ERROR_FILE=cron/log/economist.error.txt
OUTPUT_FILE=cron/log/economist.output.txt
STATUS_FILE=cron/log/economist.log

#--------------------------------------------

start_vm() {
    if ! vagrant up; then
        2>&1 echo "Error starting vm: $?"
        return 1
    fi
}

execute_vm() {
    if ! vagrant ssh -c 'cd /vagrant; node index'; then
        2>&1 echo "Error executing in vm: $?"
        return 1
    fi
}


halt_vm() {
    if ! vagrant halt; then
        2>&1 echo "Error halting vm: $?"
        return 1
    fi
}

transfer_files() {
    if ! rsync -avz -e 'ssh -p 2222' images output/* psamuels@lsatruler.com:public_html/the_economist; then
        2>&1 echo "Error transferring files: $?"
        return 1
    fi
}

#--------------------------------------------

process_start_and_stop() {
    if ! start_vm; then
        return 1
    elif ! execute_vm; then
        halt_vm
        return 1
    elif ! transfer_files; then
        halt_vm
        return 1
    elif ! halt_vm; then
        return 1
    fi
}

process() {
    if ! VBoxManage showvminfo economist | grep -q running; then
        if ! process_start_and_stop; then
            return 1
        fi
    elif ! execute_vm; then
        return 1
    elif ! transfer_files; then
        return 1
    fi
}

log_status() {
    local timestamp=$1
    local status=$2
    echo "$timestamp pid=$$ status=$status seconds=$SECONDS" >> $STATUS_FILE
}

process_and_log() {
    local timestamp=`date '+%Y-%m-%d %H:%M:%S %Z'`
    SECONDS=0

    log_status "$timestamp" started

    if process 1> $OUTPUT_FILE 2> $ERROR_FILE; then
        log_status "$timestamp" success
    else
        log_status "$timestamp" error
    fi
}

main() {
    cd /Users/perrin/save/data/projects/economist
    mkdir -p cron/log
    process_and_log
    cd - > /dev/null
}

main
