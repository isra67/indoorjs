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
    git fetch https://isra67:eloeii3769@github.com/isra67/indoorjs.git
    git reset --hard gh/master
    git clean -dn
    #git pull --rebase origin

    ## install NPM files
    npm install --silent

    PID=`ps aux | grep -i '/node index' | grep -iv 'grep ' | sed 's/\s\+/ /g' | cut -d' ' -f 2`
    kill $PID

fi

