#! /bin/bash

# #################################################################################
#
# WebIndoor system script
#       autoupdate files from repository
#
# #################################################################################


## working repository
if [ -z "$1" ]; then
    REPO="inoteska"
else
    REPO="$1"
fi


## working dir
cd /root/app


VER_LOCAL=`git log -1 | grep commit | awk '{print $2}'`
VER_REMOTE=`git ls-remote https://github.com/$REPO/indoorjs.git | grep HEAD | cut -f 1`

if [ "$VER_LOCAL" == "$VER_REMOTE" ]
then

    echo "Nothing to do"

else

    ## synchronize
#    if [ -z "$1" ]; then
#	./update.sh
#    else
#	./update.sh $1
#    fi
    ./update.sh $REPO

    PID=`ps aux | grep -i '/node server' | grep -iv 'grep ' | sed 's/\s\+/ /g' | cut -d' ' -f 2`
    kill $PID

fi

