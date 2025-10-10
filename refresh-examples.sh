#!/bin/sh

./cars query 'Speed.kmph. / Weight.kg.' | sort -n | plot -t 'Speed Per Kilogram' -x 'Year' -y 'kmph/kg' -o img/speed-per-kilogram.png

./cars query 'Power.hp. / Volume.l.' | sort -n | plot -t 'Power Per Liter' -x 'Year' -y 'hp/L' -o img/power-per-liter.png

./cars query 'Volume.l. / Cylinders.' | sort -n | plot -t 'Volume Per Cylinder' -x 'Year' -y 'L' -o img/volume-per-cylinder.png