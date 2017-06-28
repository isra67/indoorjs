#! /bin/bash

# #################################################################################
#
# WebIndoor system script
#       autoupdate files from repository
#
# #################################################################################


BRANCH="master"


## working dir
cd /root/app

GITDIFF=`git diff --name-only --ignore-space-change gh/$BRANCH`
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

    PID=`ps aux | grep -i '/node index' | grep -iv 'grep ' | sed 's/\s\+/ /g' | cut -d' ' -f 2`
    kill $PID

fi

