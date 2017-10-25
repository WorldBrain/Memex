//Remove unnecessary query params from the URL to avoid redundancy
const FILTER_PARAM = {}
const normalizeUrl = require("normalize-url")
export default function urlFilter(url) {
    var match = url.match(/:\/\/(www[0-9]?\.)?(.[^/:]+)/i);
    if (match != null && match.length > 2 && typeof match[2] === 'string' && match[2].length > 0) {
        var params = FILTER_PARAM[match[2]]
        const opts = {
            removeQueryParameters: params,
        }

        // TO-DO remove URL parts with # like www.abc.com/def#ghi

        return normalizeUrl(url, opts)
    }
    else {
        return null;
    }
}
