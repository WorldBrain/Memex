import type StorageManager from '@worldbrain/storex'
import { extractIdFromAnnotationUrl } from '@worldbrain/memex-common/lib/personal-cloud/backend/translation-layer/utils'
import { TEST_USER } from '@worldbrain/memex-common/lib/authentication/dev'

export async function insertTestPages(storageManager: StorageManager) {
    await storageManager
        .collection('pages')
        .createObject(LOCAL_TEST_DATA_V24.pages.first)
    await storageManager
        .collection('pages')
        .createObject(LOCAL_TEST_DATA_V24.pages.second)
}

const LOCAL_PAGES_V24 = {
    first: {
        url: 'getmemexed.com/test',
        fullUrl: 'https://www.getmemexed.com/test',
        domain: 'getmemexed.com',
        hostname: 'getmemexed.com',
        fullTitle: 'getmemexed.com title',
        text: '',
        lang: 'en-GB',
        canonicalUrl: 'https://www.getmemexed.com/test',
        description: 'getmemexed.com description',
    },
    second: {
        url: 'notionized.com/foo',
        fullUrl: 'https://www.notionized.com/foo',
        domain: 'notionized.com',
        hostname: 'notionized.com',
        fullTitle: 'notionized.com/foo title',
        text: '',
        lang: 'en-US',
        canonicalUrl: 'https://www.notionized.com/foo',
        description: 'notionized.com/foo description',
    },
}

const LOCAL_ANNOTATIONS_V24 = {
    first: {
        url: LOCAL_PAGES_V24.first.url + '#111111111',
        pageUrl: LOCAL_PAGES_V24.first.url,
        pageTitle: LOCAL_PAGES_V24.first.fullTitle,
        body: 'This is a test highlight',
        comment: 'This is a test comment',
        createdWhen: new Date('2020-10-10'),
        updatedWhen: new Date('2020-10-10'),
        selector: {
            quote: 'This is a test highlight',
            descriptor: { strategy: 'hyp-anchoring', content: [] },
        },
    },
    second: {
        url: LOCAL_PAGES_V24.first.url + '#111111112',
        pageUrl: LOCAL_PAGES_V24.first.url,
        pageTitle: LOCAL_PAGES_V24.first.fullTitle,
        comment: 'This is another test comment',
        createdWhen: new Date('2020-10-11'),
        updatedWhen: new Date('2020-10-20'),
    },
}

export const LOCAL_TEST_DATA_V24 = {
    pages: LOCAL_PAGES_V24,
    annotations: LOCAL_ANNOTATIONS_V24,
    visits: {
        first: {
            url: LOCAL_PAGES_V24.first.url,
            time: 4545,
            duration: 1122,
            scrollMaxPerc: 100,
            scrollMaxPx: 500,
            scrollPerc: 50,
            scrollPx: 250,
        },
        second: {
            url: LOCAL_PAGES_V24.second.url,
            time: 5545,
            duration: 174,
            scrollMaxPerc: 70,
            scrollMaxPx: 320,
            scrollPerc: 30,
            scrollPx: 130,
        },
    },
    tags: {
        first: {
            url: LOCAL_PAGES_V24.first.url,
            name: 'foo-tag',
        },
        second: {
            url: LOCAL_ANNOTATIONS_V24.first.url,
            name: 'note-tag-1',
        },
    },
}

const REMOTE_DEVICES_V24 = {
    first: {
        id: 1,
        user: TEST_USER.id,
    },
}

const REMOTE_METADATA_V24 = {
    first: {
        id: 1,
        createdWhen: 555,
        updatedWhen: 555,
        user: TEST_USER.id,
        createdByDevice: REMOTE_DEVICES_V24.first.id,
        canonicalUrl: LOCAL_TEST_DATA_V24.pages.first.canonicalUrl,
        title: LOCAL_TEST_DATA_V24.pages.first.fullTitle,
        lang: LOCAL_TEST_DATA_V24.pages.first.lang,
        description: LOCAL_TEST_DATA_V24.pages.first.description,
    },
    second: {
        id: 2,
        createdWhen: 557,
        updatedWhen: 557,
        user: TEST_USER.id,
        createdByDevice: REMOTE_DEVICES_V24.first.id,
        canonicalUrl: LOCAL_TEST_DATA_V24.pages.second.canonicalUrl,
        title: LOCAL_TEST_DATA_V24.pages.second.fullTitle,
        lang: LOCAL_TEST_DATA_V24.pages.second.lang,
        description: LOCAL_TEST_DATA_V24.pages.second.description,
    },
}

const REMOTE_LOCATORS_V24 = {
    first: {
        id: 1,
        createdWhen: 556,
        updatedWhen: 556,
        user: TEST_USER.id,
        createdByDevice: REMOTE_DEVICES_V24.first.id,
        personalContentMetadata: REMOTE_METADATA_V24.first.id,
        format: 'html',
        location: LOCAL_TEST_DATA_V24.pages.first.url,
        locationScheme: 'normalized-url-v1',
        locationType: 'remote',
        originalLocation: LOCAL_TEST_DATA_V24.pages.first.fullUrl,
        primary: true,
        valid: true,
        version: 0,
        lastVisited: 0,
        // contentSize: null,
        // fingerprint: null,
    },
    second: {
        id: 2,
        createdWhen: 558,
        updatedWhen: 558,
        user: TEST_USER.id,
        createdByDevice: REMOTE_DEVICES_V24.first.id,
        personalContentMetadata: REMOTE_METADATA_V24.second.id,
        format: 'html',
        location: LOCAL_TEST_DATA_V24.pages.second.url,
        locationScheme: 'normalized-url-v1',
        locationType: 'remote',
        originalLocation: LOCAL_TEST_DATA_V24.pages.second.fullUrl,
        primary: true,
        valid: true,
        version: 0,
        lastVisited: 0,
        // contentSize: null,
        // fingerprint: null,
    },
}

const REMOTE_ANNOTATIONS_V24 = {
    first: {
        id: 1,
        personalContentMetadata: REMOTE_METADATA_V24.first.id,
        localId: extractIdFromAnnotationUrl(
            LOCAL_TEST_DATA_V24.annotations.first.url,
        ),
        body: LOCAL_TEST_DATA_V24.annotations.first.body,
        comment: LOCAL_TEST_DATA_V24.annotations.first.comment,
        createdWhen: LOCAL_TEST_DATA_V24.annotations.first.createdWhen.getTime(),
        updatedWhen: LOCAL_TEST_DATA_V24.annotations.first.createdWhen.getTime(),
    },
    second: {
        id: 2,
        personalContentMetadata: REMOTE_METADATA_V24.first.id,
        localId: extractIdFromAnnotationUrl(
            LOCAL_TEST_DATA_V24.annotations.second.url,
        ),
        comment: LOCAL_TEST_DATA_V24.annotations.second.comment,
        createdWhen: LOCAL_TEST_DATA_V24.annotations.second.createdWhen.getTime(),
        updatedWhen: LOCAL_TEST_DATA_V24.annotations.second.createdWhen.getTime(),
    },
}

const REMOTE_ANNOTATION_SELECTORS_V24 = {
    first: {
        personalAnnotation: REMOTE_ANNOTATIONS_V24.first.id,
        selector: {
            ...LOCAL_TEST_DATA_V24.annotations.first.selector,
        },
    },
}

const REMOTE_TAGS_V24 = {
    first: {
        id: 1,
        createdByDevice: REMOTE_DEVICES_V24.first.id,
        createdWhen: 559,
        updatedWhen: 559,
        user: TEST_USER.id,
        name: LOCAL_TEST_DATA_V24.tags.first.name,
    },
    second: {
        id: 2,
        createdByDevice: REMOTE_DEVICES_V24.first.id,
        createdWhen: 560,
        updatedWhen: 560,
        user: TEST_USER.id,
        name: LOCAL_TEST_DATA_V24.tags.second.name,
    },
}

export const REMOTE_TEST_DATA_V24 = {
    personalDeviceInfo: REMOTE_DEVICES_V24,
    personalContentMetadata: REMOTE_METADATA_V24,
    personalContentLocator: REMOTE_LOCATORS_V24,
    personalContentRead: {
        first: {
            id: 1,
            createdWhen: 559,
            updatedWhen: 559,
            user: TEST_USER.id,
            createdByDevice: REMOTE_DEVICES_V24.first.id,
            personalContentMetadata: REMOTE_METADATA_V24.first.id,
            personalContentLocator: REMOTE_LOCATORS_V24.first.id,
            readWhen: LOCAL_TEST_DATA_V24.visits.first.time,
            readDuration: LOCAL_TEST_DATA_V24.visits.first.duration,
            progressPercentage: LOCAL_TEST_DATA_V24.visits.first.scrollPerc,
            scrollTotal: LOCAL_TEST_DATA_V24.visits.first.scrollMaxPx,
            scrollProgress: LOCAL_TEST_DATA_V24.visits.first.scrollPx,
            // pageTotal: null,
            // pageProgress: null,
            // durationTotal: null,
            // durationProgress: null,
        },
        second: {
            id: 2,
            createdWhen: 560,
            updatedWhen: 560,
            user: TEST_USER.id,
            createdByDevice: REMOTE_DEVICES_V24.first.id,
            personalContentMetadata: REMOTE_METADATA_V24.first.id,
            personalContentLocator: REMOTE_LOCATORS_V24.first.id,
            readWhen: LOCAL_TEST_DATA_V24.visits.second.time,
            readDuration: LOCAL_TEST_DATA_V24.visits.second.duration,
            progressPercentage: LOCAL_TEST_DATA_V24.visits.second.scrollPerc,
            scrollTotal: LOCAL_TEST_DATA_V24.visits.second.scrollMaxPx,
            scrollProgress: LOCAL_TEST_DATA_V24.visits.second.scrollPx,
        },
    },
    personalTag: REMOTE_TAGS_V24,
    personalTagConnection: {
        first: {
            id: 1,
            createdByDevice: REMOTE_DEVICES_V24.first.id,
            createdWhen: 560,
            updatedWhen: 560,
            collection: 'personalContentMetadata',
            objectId: REMOTE_METADATA_V24.first.id,
            personalTag: REMOTE_TAGS_V24.first.id,
            user: TEST_USER.id,
        },
        second: {
            id: 2,
            createdByDevice: REMOTE_DEVICES_V24.first.id,
            createdWhen: 560,
            updatedWhen: 560,
            collection: 'personalAnnotation',
            objectId: REMOTE_ANNOTATIONS_V24.first.id,
            personalTag: REMOTE_TAGS_V24.second.id,
            user: TEST_USER.id,
        },
    },
    personalAnnotation: REMOTE_ANNOTATIONS_V24,
    personalAnnotationSelector: REMOTE_ANNOTATION_SELECTORS_V24,
}
