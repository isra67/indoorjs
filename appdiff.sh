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

##GITDIFF=`git diff --name-only --ignore-space-change gh/$BRANCH`
#GITDIFF=`git diff --name-only --ignore-space-change`
GITDIFF=`git log master origin/master -1`
len=${#GITDIFF}

if [ $len -lt 3 ]
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

