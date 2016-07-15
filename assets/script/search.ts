interface Window {
	appInsights: any;
}
const ai = window.appInsights;

const localStorageDataKey = 'typesearch-data';
const localStorageOriginKey = 'typeseach-data-origin';

const dataTimeout = 1000 * 60 * 60 * 24; // 1 day

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

function typeSearch(el: HTMLInputElement) {
	const jqueryEl = $(el);
	const opts: Twitter.Typeahead.Options = {
		highlight: true,
		minLength: 0
	};

	const source = createDataSource();

	const data = {
		source,
		displayKey: 't',
		templates: {
			suggestion: (obj: MinifiedSearchRecord) => {
				return `<div class="suggestion">
						<span class="type-package-name">${obj.t}</span>
						<span class="library-name">${obj.l}</span>
						</div>`
			}
		}
	};

	jqueryEl.typeahead(opts, data);
	jqueryEl.on('typeahead:select', (unused: {}, obj: MinifiedSearchRecord) => navigate(obj.t));
	jqueryEl.keyup(k => {
		if(k.keyCode === 13) {
			navigate(el.value);
		}
	});

	jqueryEl.focus(fetchFull);
	jqueryEl.focus(() => {
		ai.trackEvent('focus');
	});

	function navigate(value: string) {
		if (ai) {
			ai.trackEvent('navigate', { target: value });
		}
		window.location.href = `https://www.npmjs.org/package/@types/${value}`;
	}

	let fetching = false;
	function fetchFull() {
		const lastFetch = +window.localStorage.getItem(localStorageOriginKey);

		if (Date.now() > lastFetch + dataTimeout) {
			if (!fetching) {
				fetching = true;

				$.getJSON('search-index-min.json', data => {
					window.localStorage.setItem(localStorageOriginKey, Date.now().toString());
					window.localStorage.setItem(localStorageDataKey, JSON.stringify(data));
					source.add(data);
					fetching = false;
				});
			}
		}
	}

	function createDataSource() {
		const local = JSON.parse(window.localStorage.getItem(localStorageDataKey)) || undefined;

		const bh = new Bloodhound({

			datumTokenizer: (entry: MinifiedSearchRecord): string[] => {
				return [entry.l, entry.p, entry.t].concat(entry.g).concat(entry.m);
			},
			queryTokenizer: (input: string) => {
				return [input];
			},
			identify: (e: MinifiedSearchRecord) => <any>e.t,
			prefetch: {
				url: 'search-index-head.json',
				ttl: dataTimeout
			},
			sorter: (x: MinifiedSearchRecord, y: MinifiedSearchRecord) => {
				// TODO: Include edit distance as additional weighting factor
				return y.d - x.d;
			},
			local
		});

		return bh;
	}

}
