import { TEST_USER } from '@worldbrain/memex-common/lib/authentication/dev'

export const LOCAL_TEST_DATA_V24 = {
    pages: {
        first: {
            url: 'getmemexed.com/test',
            fullUrl: 'https://www.getmemexed.com/test',
            domain: 'getmemexed.com',
            hostname: 'www.getmemexed.com',
            fullTitle: 'getmemexed.com title',
            text: 'page conmtent',
            lang: 'en-GB',
            canonicalUrl: 'https://www.getmemexed.com/test',
            description: 'getmemexed.com description',
        },
    },
}

export const REMOTE_TEST_DATA_V24 = {
    personalContentMetadata: {
        first: {
            id: 1,
            createdWhen: 555,
            updatedWhen: 555,
            user: TEST_USER.id,
            createdByDevice: undefined, // !!!
            canonicalUrl: 'https://www.getmemexed.com/test',
            title: 'getmemexed.com title',
        },
    },
    personalContentLocator: {
        first: {
            id: 1,
            createdWhen: 556,
            updatedWhen: 556,
            user: TEST_USER.id,
            createdByDevice: undefined,
            contentSize: null,
            fingerprint: null,
            format: 'html',
            lastVisited: null,
            location: 'getmemexed.com/test',
            locationScheme: 'normalized-url-v1',
            locationType: 'remote',
            originalLocation: 'https://www.getmemexed.com/test',
            personalContentMetadata: undefined,
            primary: true,
            valid: true,
            version: 0,
        },
    },
}
