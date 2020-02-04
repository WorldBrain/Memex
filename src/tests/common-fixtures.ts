import {
    IntegrationTestStep,
    BackgroundIntegrationTestContext,
    BackgroundIntegrationTestSetup,
} from './integration-tests'
import { StorageCollectionDiff } from './storage-change-detector'
import * as DATA from './common-fixtures.data'

export const searchModule = (setup: BackgroundIntegrationTestSetup) =>
    setup.backgroundModules.search

export const createPageStep: IntegrationTestStep<BackgroundIntegrationTestContext> = {
    execute: async ({ setup }) => {
        await searchModule(setup).searchIndex.addPage({
            pageDoc: {
                url: DATA.PAGE_1.fullUrl,
                content: {},
            },
            visits: [DATA.VISIT_1],
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
        }),
        visits: (): StorageCollectionDiff => ({
            [`[${DATA.VISIT_1},"${DATA.PAGE_1.url}"]`]: {
                type: 'create',
                object: {
                    time: DATA.VISIT_1,
                    url: DATA.PAGE_1.url,
                },
            },
        }),
    },
}
