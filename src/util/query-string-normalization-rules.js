/**
 * Hostname keys to arrays of wanted query params values.
 * These will be used to remove all but specific query params from URLs with given
 * hostnames.
 *
 * May move this to external source at later stage.
 */
export const rules = {
    'facebook.com': {
        rules: ['fbid', 'q'],
        type: 'keep',
    },
    'twitter.com': {
        rules: ['q'],
        type: 'keep',
    },
    'google.com': {
        rules: ['q'],
        type: 'keep',
    },
    'google.com.vn': {
        rules: ['q'],
        type: 'keep',
    },
    'google.com.au': {
        rules: ['q'],
        type: 'keep',
    },
    'google.com.tw': {
        rules: ['q'],
        type: 'keep',
    },
    'google.com.br': {
        rules: ['q'],
        type: 'keep',
    },
    'google.com.tr': {
        rules: ['q'],
        type: 'keep',
    },
    'google.com.gr': {
        rules: ['q'],
        type: 'keep',
    },
    'google.com.mx': {
        rules: ['q'],
        type: 'keep',
    },
    'google.com.ar': {
        rules: ['q'],
        type: 'keep',
    },
    'google.com.co': {
        rules: ['q'],
        type: 'keep',
    },
    'google.com.pk': {
        rules: ['q'],
        type: 'keep',
    },
    'google.co.jp': {
        rules: ['q'],
        type: 'keep',
    },
    'google.co.uk': {
        rules: ['q'],
        type: 'keep',
    },
    'google.co.in': {
        rules: ['q'],
        type: 'keep',
    },
    'google.co.kr': {
        rules: ['q'],
        type: 'keep',
    },
    'google.es': {
        rules: ['q'],
        type: 'keep',
    },
    'google.pl': {
        rules: ['q'],
        type: 'keep',
    },
    'google.pt': {
        rules: ['q'],
        type: 'keep',
    },
    'google.ie': {
        rules: ['q'],
        type: 'keep',
    },
    'google.cl': {
        rules: ['q'],
        type: 'keep',
    },
    'google.at': {
        rules: ['q'],
        type: 'keep',
    },
    'google.dk': {
        rules: ['q'],
        type: 'keep',
    },
    'google.be': {
        rules: ['q'],
        type: 'keep',
    },
    'google.ca': {
        rules: ['q'],
        type: 'keep',
    },
    'google.de': {
        rules: ['q'],
        type: 'keep',
    },
    'google.it': {
        rules: ['q'],
        type: 'keep',
    },
    'google.fr': {
        rules: ['q'],
        type: 'keep',
    },
    'google.nl': {
        rules: ['q'],
        type: 'keep',
    },
    'instagram.com': {
        rules: ['taken-by'],
        type: 'remove',
    }
}
export default new Map(Object.entries(rules))
