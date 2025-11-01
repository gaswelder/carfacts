#!/bin/sh

tmp=new-`date +%Y%m%d%H%M%S`.tmp
cat > $tmp

cat $tmp carfacts.txt | node src/cmd-reformat.mts > /tmp/carfacts.tmp
meld carfacts.txt /tmp/carfacts.tmp
