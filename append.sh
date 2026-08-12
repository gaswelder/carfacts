#!/bin/sh

node src/cmd-cars.mts insert || exit 1
meld carfacts.txt carfacts.txt.tmp
