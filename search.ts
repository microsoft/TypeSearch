/// <reference path="typings/tsd.d.ts" />

const bh = new Bloodhound(<any>{
	datumTokenizer: (entry: any): string[] => {
		return [entry.libraryName, entry.projectName, entry.typePackageName].concat(entry.globals);
	},
	queryTokenizer: (input: string) => {
		return [input];
	},
	identify: (e: any) => e.typePackageName,
	prefetch: {
		url: '/search-index-full.json',
		ttl: 0
	},
	sorter: (x: any, y: any) => {
		// TODO: Include edit distance as additional weighting factor
		return y.downloads - x.downloads;
	}
});

bh.clearPrefetchCache();
bh.initialize();
/*
$.getJSON('/search-index-full.json', data => {
	bh.add(data);
});
*/

function typeSearch(el: HTMLInputElement) {
	const opts: Twitter.Typeahead.Options = {
		highlight: true,
		minLength: 1
	};
	const data = {
		source: bh,
		displayKey: 'typePackageName',
		templates: {
			suggestion: (obj: any) => {
				return `<div class="suggestion">
						<span class="type-package-name">${obj.typePackageName}</span>
						<span class="library-name">${obj.libraryName}</span>
						</div>`
			}
		}
	};

	$(el).typeahead(opts, data);
}

