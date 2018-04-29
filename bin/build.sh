#!/bin/bash

DATE_NOW=$(date -d "now" +%s)

rm dist-*.tar.gz

node_modules/nps/dist/bin/nps.js build

tar zcvf dist-${DATE_NOW}.tar.gz dist/
