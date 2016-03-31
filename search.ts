/// <reference path="node_modules/@ryancavanaugh/fuse/fuse.d.ts" />
/// <reference path="../publish-typings/src/searchRecord.d.ts" />

declare var require: any;
declare var process: { argv: string[] };

import fuse = require('fuse.js');
const fs = require('fs');

interface FuseRecord {
	item: SearchRecord;
	score: number;
}

const data: SearchRecord[] = JSON.parse(fs.readFileSync('../publish-typings/search-with-downloads.json', 'utf-8'));

function customSort(left: FuseRecord, right: FuseRecord) {
	return Math.log(right.item.downloads) * (1 - right.score) - Math.log(left.item.downloads) * (1 - left.score);
}

function normalSort(left: FuseRecord, right: FuseRecord) {
	return left.score - right.score;
}

// const f = new fuse(data, <any>{ keys: ["libraryName", "packageName", "npmPackageName", "declaredExternalModules", "globals"], include: ['score'] });
const f = new fuse(data, <any>{ keys: ["globals"], include: ['score'] });
const results: FuseRecord[] = f.search(process.argv[process.argv.length - 1]).slice(0, 10);
results.sort(customSort);
// results.sort(normalSort);
results.reverse();
console.log(JSON.stringify(results.map(r => `${r.item.typePackageName}`), undefined, 4));


