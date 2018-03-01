export const SEARCH_CONN_NAME = 'search-bg-ui-runtime-connection'

/** Commands used for BG <-> UI bi-directional communication actions */
export const CMDS = {
    SEARCH: `${SEARCH_CONN_NAME}/SEARCH`,
    RESULTS: `${SEARCH_CONN_NAME}/RESULTS`,
    ERROR: `${SEARCH_CONN_NAME}/ERROR`,
}

// TODO: get a better regEx for google
export const GOOGLE_SEARCH_INJECTOR = {
    url: /http(s?):\/\/(www?).google.(com|ad|ae|com.af|com.ag|com.ai|al|am|co.ao|com.ar|as|at|com.au|az|ba|com.bd|be|bf|bg|com.bh|bi|bj|com.bn|com.bo|com.br|bs|bt|co.bw|by|com.bz|ca|cd|cf|cg|ch|ci|co.ck|cl|cm|cn|com.co|co.cr|com.cu|cv|com.cy|cz|de|dj|dk|dm|com.do|dz|com.ec|ee|com.eg|es|com.et|fi|com.fj|fm|fr|ga|ge|gg|com.gh|com.gi|gl|gm|gp|gr|com.gt|gy|com.hk|hn|hr|ht|hu|co.id|ie|co.il|im|co.in|iq|is|it|je|com.jm|jo|co.jp|co.ke|com.kh|ki|kg|co.kr|com.kw|kz|la|com.lb|li|lk|co.ls|lt|lu|lv|com.ly|co.ma|md|me|mg|mk|ml|com.mm|mn|ms|com.mt|mu|mv|mw|com.mx|com.my|co.mz|com.na|com.nf|com.ng|com.ni|ne|nl|no|com.np|nr|nu|co.nz|com.om|com.pa|com.pe|com.pg|com.ph|com.pk|pl|pn|com.pr|ps|pt|com.py|com.qa|ro|ru|rw|com.sa|com.sb|sc|se|com.sg|sh|si|sk|com.sl|sn|so|sm|sr|st|com.sv|td|tg|co.th|com.tj|tk|tl|tm|tn|to|com.tr|tt|com.tw|co.tz|com.ua|co.ug|co.uk|com.uy|co.uz|com.vc|co.ve|vg|co.vi|com.vn|vu|ws|rs|co.za|co.zm|co.zw|cat)\/(search)\/*/,
    // url2: /http(s?):\/\/*.google.*\/search/,
    container: 'mw',
}

export const INJECTOR_RESULTS_LIMIT = 5

// Toggle search Injection to webpage
export const SEARCH_INJECTION_KEY = 'searchInjection'

export const OVERVIEW_URL = '/overview/overview.html'
