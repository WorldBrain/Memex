/**
 * Hostname keys to arrays of wanted query params values.
 * These will be used to remove all but specific query params from URLs with given
 * hostnames.
 *
 * May move this to external source at later stage.
 */
export const rules = {
	'facebook.com': ['fbid']
	'twitter.com': ['q'],
    'google.com': ['q'],
    'google.com.vn': ['q'],
    'google.com.au': ['q'],
    'google.com.tw': ['q'],
    'google.com.br': ['q'],
    'google.com.tr': ['q'],
    'google.com.gr': ['q'],
    'google.com.mx': ['q'],
    'google.com.ar': ['q'],
    'google.com.co': ['q'],
    'google.com.pk': ['q'],
    'google.co.jp': ['q'],
    'google.co.uk': ['q'],
    'google.co.in': ['q'],
    'google.co.kr': ['q'],
    'google.es': ['q'],
    'google.pl': ['q'],
    'google.pt': ['q'],
    'google.ie': ['q'],
    'google.cl': ['q'],
    'google.at': ['q'],
    'google.dk': ['q'],
    'google.be': ['q'],
    'google.ca': ['q'],
    'google.de': ['q'],
    'google.it': ['q'],
    'google.fr': ['q'],
    'google.nl': ['q'],
    'facebook.com': ['q'],
}

export default new Map(Object.entries(rules))
