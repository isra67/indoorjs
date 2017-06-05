#! /bin/bash

# #################################################################################
#
# WebIndoor system script
#       update files from repository
#
# #################################################################################

## working dir
cd /root/app

## backup INI file
#cp -f indoor.ini /tmp

## synchronize
git fetch --all
git reset --hard origin/master
git clean -dn

## remove unnecessary files
#rm -f my_lib/*.py

## restore INI file
#cp /tmp/indoor.ini /root/indoorpy

## install NPM files
npm install

