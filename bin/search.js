/// <reference path="typings/tsd.d.ts" />
var ai = window['appInsights'];
var localStorageDataKey = 'typesearch-data';
var localStorageOriginKey = 'typeseach-data-origin';
var dataTimeout = 1000 * 60 * 60 * 24; // 1 day
function typeSearch(el) {
    var jqueryEl = $(el);
    var opts = {
        highlight: true,
        minLength: 0
    };
    var source = createDataSource();
    var data = {
        source: source,
        displayKey: 't',
        templates: {
            suggestion: function (obj) {
                return "<div class=\"suggestion\">\n\t\t\t\t\t\t<span class=\"type-package-name\">" + obj.t + "</span>\n\t\t\t\t\t\t<span class=\"library-name\">" + obj.l + "</span>\n\t\t\t\t\t\t</div>";
            }
        }
    };
    jqueryEl.typeahead(opts, data);
    jqueryEl.on('typeahead:select', function (unused, obj) { return navigate(obj.t); });
    jqueryEl.keyup(function (k) {
        if (k.keyCode === 13) {
            navigate(el.value);
        }
    });
    jqueryEl.focus(fetchFull);
    jqueryEl.focus(function () {
        ai.trackEvent('focus');
    });
    function navigate(value) {
        if (ai) {
            ai.trackEvent('navigate', { target: value });
        }
        // Navigate only if the selected string is a valid package, else return.
        const result = source.local.some(e => e.t === value); 
        if (!result) {
            return;
        }
        window.location.href = "https://www.npmjs.org/package/@types/" + value;
    }
    var fetching = false;
    function fetchFull() {
        var lastFetch = +window.localStorage.getItem(localStorageOriginKey);
        if (Date.now() > lastFetch + dataTimeout) {
            if (!fetching) {
                fetching = true;
                $.getJSON('search-index-min.json', function (data) {
                    window.localStorage.setItem(localStorageOriginKey, Date.now().toString());
                    window.localStorage.setItem(localStorageDataKey, JSON.stringify(data));
                    source.add(data);
                    fetching = false;
                });
            }
        }
    }
    function createDataSource() {
        var query = "";
        var local = JSON.parse(window.localStorage.getItem(localStorageDataKey)) || undefined;
        var bh = new Bloodhound({
            datumTokenizer: function (entry) {
                return [entry.l, entry.p, entry.t].concat(entry.g).concat(entry.m);
            },
            queryTokenizer: function (input) {
                query = input;
                return [input];
            },
            identify: function (e) { return e.t; },
            prefetch: {
                url: 'search-index-head.json',
                ttl: dataTimeout
            },
            sorter: function (x, y) {
                // TODO: Include edit distance as additional weighting factor
                // Direct matches should be ranked higher, else rank on basis of download count
                if (x.t === query || x.t === (query + "js") || x.t === (query + ".js") || x.t === (query + "-js")) {
                    return -1;
                }
                else if (y.t === query || y.t === (query + "js") || y.t === (query + ".js") || y.t === (query + "-js")) {
                    return 1;
                }
                else {
                    return y.d - x.d;
                }
            },
            local: local
        });
        return bh;
    }
}
