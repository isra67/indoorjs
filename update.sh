#! /bin/bash

# #################################################################################
#
# WebIndoor system script
#       update files from repository
#
# #################################################################################

## working dir
cd /root/app

## synchronize
if [ -z "$1" ]; then
    git fetch https://github.com/isra67/indoorjs.git
else
    git fetch https://isra67:$1@github.com/isra67/indoorjs.git
fi

git reset --hard gh/master
git clean -dn

## install NPM files
npm install --silent

