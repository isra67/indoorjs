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
git fetch https://isra67:eloeii3769@github.com/isra67/indoorjs.git
git reset --hard origin/master
git clean -dn

## install NPM files
npm install

