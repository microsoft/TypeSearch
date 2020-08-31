var searchIndexUrl = "https://typespublisher.blob.core.windows.net/typespublisher/data/search-index-min.json";
function typeSearch(jqueryEl, search) {
    var opts = {
        highlight: true,
        minLength: 0
    };
    var data = {
        source: createDataSource(),
        displayKey: 't',
        templates: {
            suggestion: function (obj) {
                return "\n\t\t\t\t\t<div class=\"suggestion\">\n\t\t\t\t\t\t<span class=\"type-package-name\">" + obj.t + "</span>\n\t\t\t\t\t\t<span class=\"library-name\">" + obj.l + "</span>\n\t\t\t\t\t</div>\n\t\t\t\t";
            }
        }
    };
    jqueryEl.typeahead(opts, data);
    jqueryEl.on('typeahead:select', function (unused, obj) { return navigate(obj); });
    jqueryEl.keyup(function (k) {
        if (k.keyCode === 13) { // Enter key
            var selectables = jqueryEl.siblings(".tt-menu").find(".tt-selectable");
            $(selectables[0]).trigger("click");
        }
        else {
            updateSearch(jqueryEl.val());
        }
    });
    if (search) {
        jqueryEl.typeahead('val', search).typeahead('open');
    }
    function navigate(record) {
        window.location.href = "https://www.npmjs.org/package/@types/" + record.t;
    }
    function updateSearch(newValue) {
        if (!URLSearchParams) {
            return;
        }
        var params = new URLSearchParams(window.location.search);
        params.set('search', newValue);
        history.pushState(null, '', window.location.pathname + "?" + params);
    }
    function createDataSource() {
        var query = "";
        return new Bloodhound({
            // See https://github.com/twitter/typeahead.js/blob/master/doc/bloodhound.md#options
            prefetch: searchIndexUrl,
            datumTokenizer: function (entry) {
                return [entry.l, entry.p, entry.t].concat(entry.g).concat(entry.m);
            },
            queryTokenizer: function (input) {
                query = input;
                return [input];
            },
            identify: function (e) { return e.t; },
            sorter: function (x, y) {
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
$(function () {
    var params = window.location.search
        .substring(1)
        .split('&')
        .reduce(function (params, pair) {
        var _a = pair.split('='), key = _a[0], value = _a[1];
        params[key] = value;
        return params;
    }, {});
    var jqueryEl = $("#demo");
    typeSearch(jqueryEl, params.search);
    jqueryEl.focus();
});
