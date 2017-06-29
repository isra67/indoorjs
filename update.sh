#! /bin/bash

# #################################################################################
#
# WebIndoor system script
#       update files from repository
#
# #################################################################################

## working dir
cd /root/app

## backup app file
cp -f public/storage/store.dat /root/tmp

## synchronize
if [ -z "$1" ]; then
    git fetch https://github.com/isra67/indoorjs.git
else
    git fetch https://isra67:$1@github.com/isra67/indoorjs.git
fi
git reset --hard gh/master
if [ -z "$1" ]; then
    git pull --rebase https://github.com/isra67/indoorjs.git
else
    git pull --rebase  https://isra67:$1@github.com/isra67/indoorjs.git
fi
git clean -dn

## install NPM files
npm install --silent

## restore app file from backup
cp -f /root/tmp/store.dat public/storage

## save from cache
sync