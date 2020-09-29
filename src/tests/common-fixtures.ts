import {
    IntegrationTestStep,
    BackgroundIntegrationTestContext,
    BackgroundIntegrationTestSetup,
} from './integration-tests'
import { StorageCollectionDiff } from './storage-change-detector'
import * as DATA from './common-fixtures.data'

export const createPageStep: IntegrationTestStep<BackgroundIntegrationTestContext> = {
    execute: async ({ setup }) => {
        await setup.backgroundModules.pages.addPage({
            pageDoc: {
                url: DATA.PAGE_1.fullUrl,
                content: {},
            },
            visits: [DATA.VISIT_1],
            rejectNoContent: false,
        })
        await setup.backgroundModules.pages.addPage({
            pageDoc: {
                url: DATA.PAGE_2.fullUrl,
                content: {},
            },
            visits: [DATA.VISIT_2],
            rejectNoContent: false,
        })
    },
    expectedStorageChanges: {
        pages: (): StorageCollectionDiff => ({
            [DATA.PAGE_1.url]: {
                type: 'create',
                object: {
                    url: DATA.PAGE_1.url,
                    fullUrl: DATA.PAGE_1.fullUrl,
                    domain: DATA.PAGE_1.domain,
                    hostname: DATA.PAGE_1.hostname,
                    urlTerms: [],
                },
            },
            [DATA.PAGE_2.url]: {
                type: 'create',
                object: {
                    url: DATA.PAGE_2.url,
                    fullUrl: DATA.PAGE_2.fullUrl,
                    domain: DATA.PAGE_2.domain,
                    hostname: DATA.PAGE_2.hostname,
                    urlTerms: [],
                },
            },
        }),
        visits: (): StorageCollectionDiff => ({
            [`[${DATA.VISIT_1},"${DATA.PAGE_1.url}"]`]: {
                type: 'create',
                object: {
                    time: DATA.VISIT_1,
                    url: DATA.PAGE_1.url,
                },
            },
            [`[${DATA.VISIT_2},"${DATA.PAGE_2.url}"]`]: {
                type: 'create',
                object: {
                    time: DATA.VISIT_2,
                    url: DATA.PAGE_2.url,
                },
            },
        }),
    },
}
