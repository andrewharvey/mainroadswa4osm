#!/bin/sh

mkdir unzip
for f in cache/*.zip; do
    b=`basename "$f" .zip`
    echo $b
    mkdir unzip/$b
    unzip -d unzip/$b $f
done
