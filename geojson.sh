#!/bin/bash

declare -A select
select=( \
    ["FunctionalClassMRWA_522"]="road_name,common_usa,cwy,networy_ty,functional" \
    )

rm -rf GeoJSON
mkdir -p GeoJSON
for f in unzip/*/*.shp; do
    b=`basename $f .shp`
    echo $b
    #-select "${select[$b]}"
    ogr2ogr -f 'GeoJSON' -t_srs 'EPSG:4326' GeoJSON/$b.geojson $f
done
