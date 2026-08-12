#!/bin/sh

node src/cmd-insert.mts || exit 1
meld carfacts.txt carfacts.txt.tmp
