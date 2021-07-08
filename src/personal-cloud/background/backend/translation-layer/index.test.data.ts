import type StorageManager from '@worldbrain/storex'
import { extractIdFromAnnotationUrl } from '@worldbrain/memex-common/lib/personal-cloud/backend/translation-layer/utils'
import { TEST_USER } from '@worldbrain/memex-common/lib/authentication/dev'
import { AnnotationPrivacyLevels } from 'src/annotations/types'
import { EXTENSION_SETTINGS_NAME } from '@worldbrain/memex-common/lib/extension-settings/constants'

export async function insertTestPages(storageManager: StorageManager) {
    await storageManager
        .collection('pages')
        .createObject(LOCAL_TEST_DATA_V24.pages.first)
    await storageManager
        .collection('pages')
        .createObject(LOCAL_TEST_DATA_V24.pages.second)
}

export async function insertReadwiseAPIKey(
    storageManager: StorageManager,
    userId: string,
) {
    await storageManager
        .collection('personalMemexExtensionSetting')
        .createObject({
            name: EXTENSION_SETTINGS_NAME.ReadwiseAPIKey,
            value: 'test-key',
            user: userId,
        })
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
        lastEdited: new Date('2020-10-10'),
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
        lastEdited: new Date('2020-10-20'),
    },
}

const LOCAL_LISTS_V24 = {
    first: {
        id: 1619414286452,
        name: 'Test list A',
        searchableName: 'Test list A',
        createdAt: new Date(1619414286452),
        isDeletable: true,
        isNestable: true,
    },
    second: {
        id: 1619414286456,
        name: 'Test list B',
        searchableName: 'Test list B',
        createdAt: new Date(1619414286456),
        isDeletable: true,
        isNestable: true,
    },
}

export const LOCAL_TEST_DATA_V24 = {
    pages: LOCAL_PAGES_V24,
    bookmarks: {
        first: {
            url: LOCAL_PAGES_V24.first.url,
            time: 1622010270273,
        },
    },
    annotations: LOCAL_ANNOTATIONS_V24,
    annotationPrivacyLevels: {
        first: {
            id: 1,
            annotation: LOCAL_ANNOTATIONS_V24.first.url,
            privacyLevel: AnnotationPrivacyLevels.SHARED,
            createdWhen: new Date(1625190554983),
        },
        second: {
            id: 2,
            annotation: LOCAL_ANNOTATIONS_V24.second.url,
            privacyLevel: AnnotationPrivacyLevels.PROTECTED,
            createdWhen: new Date(1625190554984),
        },
    },
    sharedAnnotationMetadata: {
        first: {
            excludeFromLists: false,
            localId: LOCAL_ANNOTATIONS_V24.first.url,
            remoteId: 'test-1',
        },
        second: {
            excludeFromLists: true,
            localId: LOCAL_ANNOTATIONS_V24.second.url,
            remoteId: 'test-2',
        },
    },
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
        firstPageTag: {
            url: LOCAL_PAGES_V24.first.url,
            name: 'foo-tag',
        },
        secondPageTag: {
            url: LOCAL_PAGES_V24.second.url,
            name: 'foo-tag',
        },
        firstAnnotationTag: {
            url: LOCAL_ANNOTATIONS_V24.first.url,
            name: 'annot-tag',
        },
        secondAnnotationTag: {
            url: LOCAL_ANNOTATIONS_V24.second.url,
            name: 'annot-tag',
        },
    },
    customLists: LOCAL_LISTS_V24,
    sharedListMetadata: {
        first: {
            localId: LOCAL_LISTS_V24.first.id,
            remoteId: 'test-1',
        },
        second: {
            localId: LOCAL_LISTS_V24.second.id,
            remoteId: 'test-2',
        },
    },
    pageListEntries: {
        first: {
            createdAt: new Date(1625190554480),
            fullUrl: LOCAL_PAGES_V24.first.fullUrl,
            pageUrl: LOCAL_PAGES_V24.first.url,
            listId: LOCAL_LISTS_V24.first.id,
        },
        second: {
            createdAt: new Date(1625190554986),
            fullUrl: LOCAL_PAGES_V24.second.fullUrl,
            pageUrl: LOCAL_PAGES_V24.second.url,
            listId: LOCAL_LISTS_V24.first.id,
        },
    },
    templates: {
        first: {
            id: 1,
            isFavourite: false,
            title: 'Roam Markdown',
            code: '[[{{{PageTitle}}}]]',
        },
        second: {
            id: 2,
            isFavourite: true,
            title: 'Other Markdown',
            code: '[[{{{PageUrl}}}]]',
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
        user: TEST_USER.id,
        createdByDevice: REMOTE_DEVICES_V24.first.id,
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
        user: TEST_USER.id,
        createdByDevice: REMOTE_DEVICES_V24.first.id,
    },
}

const REMOTE_ANNOTATION_SELECTORS_V24 = {
    first: {
        id: 1,
        createdWhen: 560,
        updatedWhen: 560,
        user: TEST_USER.id,
        createdByDevice: REMOTE_DEVICES_V24.first.id,
        personalAnnotation: REMOTE_ANNOTATIONS_V24.first.id,
        selector: {
            ...LOCAL_TEST_DATA_V24.annotations.first.selector,
        },
    },
}

const REMOTE_TAGS_V24 = {
    firstPageTag: {
        id: 1,
        createdByDevice: REMOTE_DEVICES_V24.first.id,
        createdWhen: 559,
        updatedWhen: 559,
        user: TEST_USER.id,
        name: LOCAL_TEST_DATA_V24.tags.firstPageTag.name,
    },
    firstAnnotationTag: {
        id: 1,
        createdByDevice: REMOTE_DEVICES_V24.first.id,
        createdWhen: 560,
        updatedWhen: 560,
        user: TEST_USER.id,
        name: LOCAL_TEST_DATA_V24.tags.firstAnnotationTag.name,
    },
}

const REMOTE_LISTS_V24 = {
    first: {
        id: 1,
        localId: LOCAL_LISTS_V24.first.id,
        name: LOCAL_LISTS_V24.first.name,
        isDeletable: LOCAL_LISTS_V24.first.isDeletable,
        isNestable: LOCAL_LISTS_V24.first.isNestable,
        createdWhen: LOCAL_LISTS_V24.first.createdAt.getTime(),
        updatedWhen: LOCAL_LISTS_V24.first.createdAt.getTime(),
        createdByDevice: REMOTE_DEVICES_V24.first.id,
        user: TEST_USER.id,
    },
    second: {
        id: 2,
        localId: LOCAL_LISTS_V24.second.id,
        name: LOCAL_LISTS_V24.second.name,
        isDeletable: LOCAL_LISTS_V24.second.isDeletable,
        isNestable: LOCAL_LISTS_V24.second.isNestable,
        createdWhen: LOCAL_LISTS_V24.second.createdAt.getTime(),
        updatedWhen: LOCAL_LISTS_V24.second.createdAt.getTime(),
        createdByDevice: REMOTE_DEVICES_V24.first.id,
        user: TEST_USER.id,
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
            scrollMaxPercentage: LOCAL_TEST_DATA_V24.visits.first.scrollMaxPerc,
            scrollEndPercentage: LOCAL_TEST_DATA_V24.visits.first.scrollPerc,
            scrollMaxPixel: LOCAL_TEST_DATA_V24.visits.first.scrollMaxPx,
            scrollEndPixel: LOCAL_TEST_DATA_V24.visits.first.scrollPx,
            // pageTotal: null,
            // pageProgress: null,
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
            scrollMaxPercentage:
                LOCAL_TEST_DATA_V24.visits.second.scrollMaxPerc,
            scrollEndPercentage: LOCAL_TEST_DATA_V24.visits.second.scrollPerc,
            scrollMaxPixel: LOCAL_TEST_DATA_V24.visits.second.scrollMaxPx,
            scrollEndPixel: LOCAL_TEST_DATA_V24.visits.second.scrollPx,
            // pageTotal: null,
            // pageProgress: null,
        },
    },
    personalBookmark: {
        first: {
            id: 1,
            personalContentMetadata: REMOTE_METADATA_V24.first.id,
            user: TEST_USER.id,
            createdByDevice: REMOTE_DEVICES_V24.first.id,
            createdWhen: LOCAL_TEST_DATA_V24.bookmarks.first.time,
            updatedWhen: LOCAL_TEST_DATA_V24.bookmarks.first.time,
        },
    },
    personalTag: REMOTE_TAGS_V24,
    personalTagConnection: {
        firstPageTag: {
            id: 1,
            createdByDevice: REMOTE_DEVICES_V24.first.id,
            createdWhen: 560,
            updatedWhen: 560,
            collection: 'personalContentMetadata',
            objectId: REMOTE_METADATA_V24.first.id,
            personalTag: REMOTE_TAGS_V24.firstPageTag.id,
            user: TEST_USER.id,
        },
        secondPageTag: {
            id: 2,
            createdByDevice: REMOTE_DEVICES_V24.first.id,
            createdWhen: 562,
            updatedWhen: 562,
            collection: 'personalContentMetadata',
            objectId: REMOTE_METADATA_V24.second.id,
            personalTag: REMOTE_TAGS_V24.firstPageTag.id,
            user: TEST_USER.id,
        },
        firstAnnotationTag: {
            id: 1,
            createdByDevice: REMOTE_DEVICES_V24.first.id,
            createdWhen: 561,
            updatedWhen: 561,
            collection: 'personalAnnotation',
            objectId: REMOTE_ANNOTATIONS_V24.first.id,
            personalTag: REMOTE_TAGS_V24.firstPageTag.id,
            user: TEST_USER.id,
        },
        secondAnnotationTag: {
            id: 2,
            createdByDevice: REMOTE_DEVICES_V24.first.id,
            createdWhen: 563,
            updatedWhen: 563,
            collection: 'personalAnnotation',
            objectId: REMOTE_ANNOTATIONS_V24.second.id,
            personalTag: REMOTE_TAGS_V24.firstPageTag.id,
            user: TEST_USER.id,
        },
    },
    personalAnnotation: REMOTE_ANNOTATIONS_V24,
    personalAnnotationSelector: REMOTE_ANNOTATION_SELECTORS_V24,
    personalAnnotationPrivacyLevel: {
        first: {
            id: 1,
            localId: LOCAL_TEST_DATA_V24.annotationPrivacyLevels.first.id,
            privacyLevel:
                LOCAL_TEST_DATA_V24.annotationPrivacyLevels.first.privacyLevel,
            personalAnnotation: REMOTE_ANNOTATIONS_V24.first.id,
            createdByDevice: REMOTE_DEVICES_V24.first.id,
            user: TEST_USER.id,
            createdWhen: LOCAL_TEST_DATA_V24.annotationPrivacyLevels.first.createdWhen.getTime(),
            updatedWhen: LOCAL_TEST_DATA_V24.annotationPrivacyLevels.first.createdWhen.getTime(),
        },
        second: {
            id: 1,
            localId: LOCAL_TEST_DATA_V24.annotationPrivacyLevels.second.id,
            privacyLevel:
                LOCAL_TEST_DATA_V24.annotationPrivacyLevels.second.privacyLevel,
            personalAnnotation: REMOTE_ANNOTATIONS_V24.second.id,
            createdByDevice: REMOTE_DEVICES_V24.first.id,
            user: TEST_USER.id,
            createdWhen: LOCAL_TEST_DATA_V24.annotationPrivacyLevels.second.createdWhen.getTime(),
            updatedWhen: LOCAL_TEST_DATA_V24.annotationPrivacyLevels.second.createdWhen.getTime(),
        },
    },
    personalAnnotationShare: {
        first: {
            id: 1,
            remoteId:
                LOCAL_TEST_DATA_V24.sharedAnnotationMetadata.first.remoteId,
            excludeFromLists:
                LOCAL_TEST_DATA_V24.sharedAnnotationMetadata.first
                    .excludeFromLists,
            personalAnnotation: REMOTE_ANNOTATIONS_V24.first.id,
            user: TEST_USER.id,
            createdByDevice: REMOTE_DEVICES_V24.first.id,
            createdWhen: 565,
            updatedWhen: 565,
        },
        second: {
            id: 2,
            remoteId:
                LOCAL_TEST_DATA_V24.sharedAnnotationMetadata.second.remoteId,
            excludeFromLists:
                LOCAL_TEST_DATA_V24.sharedAnnotationMetadata.second
                    .excludeFromLists,
            personalAnnotation: REMOTE_ANNOTATIONS_V24.second.id,
            user: TEST_USER.id,
            createdByDevice: REMOTE_DEVICES_V24.first.id,
            createdWhen: 565,
            updatedWhen: 565,
        },
    },
    personalList: REMOTE_LISTS_V24,
    personalListShare: {
        first: {
            id: 1,
            personalList: REMOTE_LISTS_V24.first.id,
            remoteId: LOCAL_TEST_DATA_V24.sharedListMetadata.first.remoteId,
            user: TEST_USER.id,
            createdByDevice: REMOTE_DEVICES_V24.first.id,
            createdWhen: 565,
            updatedWhen: 565,
        },
        second: {
            id: 2,
            personalList: REMOTE_LISTS_V24.second.id,
            remoteId: LOCAL_TEST_DATA_V24.sharedListMetadata.second.remoteId,
            user: TEST_USER.id,
            createdByDevice: REMOTE_DEVICES_V24.first.id,
            createdWhen: 565,
            updatedWhen: 565,
        },
    },
    personalListEntry: {
        first: {
            id: 1,
            personalContentMetadata: REMOTE_METADATA_V24.first.id,
            personalList: REMOTE_LISTS_V24.first.id,
            createdByDevice: REMOTE_DEVICES_V24.first.id,
            user: TEST_USER.id,
            createdWhen: 563,
            updatedWhen: 563,
        },
        second: {
            id: 2,
            personalContentMetadata: REMOTE_METADATA_V24.second.id,
            personalList: REMOTE_LISTS_V24.first.id,
            createdByDevice: REMOTE_DEVICES_V24.first.id,
            user: TEST_USER.id,
            createdWhen: 563,
            updatedWhen: 563,
        },
    },
    personalTextTemplate: {
        first: {
            id: 1,
            isFavourite: LOCAL_TEST_DATA_V24.templates.first.isFavourite,
            title: LOCAL_TEST_DATA_V24.templates.first.title,
            localId: LOCAL_TEST_DATA_V24.templates.first.id,
            code: LOCAL_TEST_DATA_V24.templates.first.code,
            createdByDevice: REMOTE_DEVICES_V24.first.id,
            user: TEST_USER.id,
            createdWhen: 561,
            updatedWhen: 561,
        },
        second: {
            id: 2,
            isFavourite: LOCAL_TEST_DATA_V24.templates.second.isFavourite,
            title: LOCAL_TEST_DATA_V24.templates.second.title,
            localId: LOCAL_TEST_DATA_V24.templates.second.id,
            code: LOCAL_TEST_DATA_V24.templates.second.code,
            createdByDevice: REMOTE_DEVICES_V24.first.id,
            user: TEST_USER.id,
            createdWhen: 562,
            updatedWhen: 562,
        },
    },
    personalReadwiseAction: {
        first: {
            id: 1,
            personalAnnotation: REMOTE_ANNOTATIONS_V24.first.id,
            createdWhen: new Date(1625634720653),
            updatedWhen: new Date(1625634720653),
            user: TEST_USER.id,
            createdByDevice: REMOTE_DEVICES_V24.first.id,
        },
        second: {
            id: 2,
            personalAnnotation: REMOTE_ANNOTATIONS_V24.second.id,
            createdWhen: new Date(1625634720654),
            updatedWhen: new Date(1625634720654),
            user: TEST_USER.id,
            createdByDevice: REMOTE_DEVICES_V24.first.id,
        },
    },
}
