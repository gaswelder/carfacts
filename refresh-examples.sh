#!/bin/sh

./cars query 'Power.hp. / Volume.l.' | sort -n | plot -l 0 -t 'Power Per Liter' -x 'Year' -y 'hp/L' -o img/power-per-liter.png

./cars query 'Speed.kmph. / Weight.kg.' | sort -n | plot -l 0 -t 'Speed Per Kilogram' -x 'Year' -y 'kmph/kg' -o img/speed-per-kilogram.png

./cars query 'Volume.l. / Cylinders' | sort -n | plot -l 0 -t 'Volume Per Cylinder' -x 'Year' -y 'L' -o img/volume-per-cylinder.png

./cars query speed.kmph./power.hp. | plot -l 0 -t 'Speed Per Horsepower' -x Year -y 'kmph/hp' -o img/speed-per-horsepower.png
