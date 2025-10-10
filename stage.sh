#!/bin/sh
cat carfacts.txt | node src/cmd-reformat.mts > carfacts2.txt
meld carfacts.txt carfacts2.txt
