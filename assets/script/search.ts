const searchIndexUrl = "https://typespublisher.blob.core.windows.net/typespublisher/data/search-index-min.json";

interface MinifiedSearchRecord {
	// types package name
	t: string;
	// globals
	g: string[];
	// modules
	m: string[];
	// project name
	p: string;
	// library name
	l: string;
	// downloads in the last month from NPM
	d: number;
}

interface Bloodhound<T> {
	local: T[];
}

function typeSearch(jqueryEl: JQuery, search?: string) {
	const opts: Twitter.Typeahead.Options = {
		highlight: true,
		minLength: 0
	};

	const data = {
		source: createDataSource(),
		displayKey: 't',
		templates: {
			suggestion: (obj: MinifiedSearchRecord) => {
				return `
					<div class="suggestion">
						<span class="type-package-name">${obj.t}</span>
						<span class="library-name">${obj.l}</span>
					</div>
				`;
			}
		}
	};

	jqueryEl.typeahead(opts, data);
	jqueryEl.on('typeahead:select', (unused: {}, obj: MinifiedSearchRecord) => navigate(obj));
	jqueryEl.keyup(k => {
		if (k.keyCode === 13) { // Enter key
			const selectables = jqueryEl.siblings(".tt-menu").find(".tt-selectable");
			$(selectables[0]).trigger("click");
		} else {
			updateSearch(jqueryEl.val());
		}
	});

	if (search) {
		jqueryEl.typeahead('val', search).typeahead('open');
	}

	function navigate(record: MinifiedSearchRecord) {
		window.location.href = `https://www.npmjs.org/package/@types/${record.t}`;
	}

	function updateSearch(newValue: string) {
		if (!URLSearchParams) {
			return;
		}

		const params = new URLSearchParams(window.location.search);
		params.set('search', newValue);

		history.pushState(null, '', `${window.location.pathname}?${params}`);
	}

	function createDataSource(): Bloodhound<MinifiedSearchRecord> {
		let query = "";
		return new Bloodhound<MinifiedSearchRecord>({
			// See https://github.com/twitter/typeahead.js/blob/master/doc/bloodhound.md#options
			prefetch: searchIndexUrl,
			datumTokenizer: (entry: MinifiedSearchRecord) => {
				return [entry.l, entry.p, entry.t].concat(entry.g).concat(entry.m);
			},
			queryTokenizer: input => {
				query = input;
				return [input];
			},
			identify: e => <any>e.t,
			sorter: (x, y) => {
				// TODO: Include edit distance as additional weighting factor
				// Direct matches should be ranked higher, else rank on basis of download count
				if (x.t === query || x.t === (query + "js") || x.t === (query + ".js") || x.t === (query + "-js")) {
					return -1;
				}

				if (y.t === query || y.t === (query + "js") || y.t === (query + ".js") || y.t === (query + "-js")) {
					return 1;
				}
				
				return y.d - x.d;
			}
		});
	}
}

$(() => {
	const params = window.location.search
		.substring(1)
		.split('&')
		.reduce<Record<string, string>>((params, pair) => {
			const [key, value] = pair.split('=');
			params[key] = value;
			return params;
		}, {});
	const jqueryEl = $("#demo");

	typeSearch(jqueryEl, params.search);
	jqueryEl.focus();
});
