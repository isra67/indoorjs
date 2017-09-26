#! /bin/bash

# #################################################################################
#
# WebIndoor system script
#       autoupdate files from repository
#
# #################################################################################


## PATH=/usr/local/bin:/usr/bin:/bin:/usr/local/sbin:/usr/sbin:/sbin


BRANCH="master"


## working dir
cd /root/app

###GITDIFF=`git diff --name-only --ignore-space-change gh/$BRANCH`
##GITDIFF=`git diff --name-only --ignore-space-change`
#GITDIFF=`git log master..origin/master -1`
#len=${#GITDIFF}

#if [ $len -lt 3 ]

#VER_LOCAL=`git log -1 --oneline origin/master`
#VER_REMOTE=`git log -1 --oneline origin/master...HEAD`
VER_REMOTE=`git ls-remote https://github.com/isra67/indoorjs.git | grep master | cut -f 1`
GITDIFF=`git cherry -v | grep $VER_REMOTE`
len=${#GITDIFF}
if [ $len -lt 3 ]

#if [ "$VER_LOCAL" == "$VER_REMOTE" ]
then

    echo "Nothing to do"

else

    ## synchronize
    if [ -z "$1" ]; then
	./update.sh
    else
	./update.sh $1
    fi

    PID=`ps aux | grep -i '/node server' | grep -iv 'grep ' | sed 's/\s\+/ /g' | cut -d' ' -f 2`
    kill $PID

fi

