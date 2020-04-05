import expect from 'expect'
import Storex from '@worldbrain/storex'
import { registerModuleMapCollections } from '@worldbrain/storex-pattern-modules'

import * as DATA from './dexie-utils.test.data'
import initStorageManager from 'src/search/memory-storex'
import { DexieUtilsPlugin } from './dexie-utils'
import CustomListStorage from 'src/custom-lists/background/storage'
import BookmarksStorage from 'src/bookmarks/background/storage'
import AnnotationStorage from 'src/direct-linking/background/storage'
import { setupBackgroundIntegrationTest } from 'src/tests/background-integration-tests'

describe('Dexie Utils storex plugin', () => {
    async function setupTest() {
        const { storageManager } = await setupBackgroundIntegrationTest()
        await insertTestData(storageManager)

        // const plugin = new DexieUtilsPlugin()
        // plugin.install(storageManager.backend as any)

        return { storageManager }
    }

    async function insertTestData(storageManager: Storex) {
        await storageManager.collection('pages').createObject(DATA.PAGE_1)
        await storageManager.collection('pages').createObject(DATA.PAGE_2)
        await storageManager
            .collection('visits')
            .createObject({ url: DATA.PAGE_1.url, time: DATA.VISIT_1 })
        await storageManager
            .collection('visits')
            .createObject({ url: DATA.PAGE_1.url, time: DATA.VISIT_2 })
        await storageManager
            .collection('visits')
            .createObject({ url: DATA.PAGE_2.url, time: DATA.VISIT_3 })
        await storageManager
            .collection('bookmarks')
            .createObject({ url: DATA.PAGE_1.url, time: DATA.BOOKMARK_1 })
        await storageManager
            .collection('tags')
            .createObject({ url: DATA.PAGE_1.url, name: DATA.TAG_1 })
        await storageManager
            .collection('annotations')
            .createObject(DATA.ANNOT_1)
    }

    it('should delete pages by URL regexp + assoc. data', async () => {
        const { storageManager } = await setupTest()

        expect(
            await storageManager
                .collection('pages')
                .findObject({ url: DATA.PAGE_1.url }),
        ).not.toBeNull()
        expect(
            await storageManager
                .collection('pages')
                .findObject({ url: DATA.PAGE_2.url }),
        ).not.toBeNull()
        const bookmarkBefore = await storageManager
            .collection('bookmarks')
            .findObject({ url: DATA.PAGE_1.url })
        const visitsBefore = await storageManager
            .collection('visits')
            .findObjects({ url: DATA.PAGE_1.url })
        const tagsBefore = await storageManager
            .collection('tags')
            .findObjects({ url: DATA.PAGE_1.url })
        const annotsBefore = await storageManager
            .collection('annotations')
            .findObjects({ pageUrl: DATA.PAGE_1.url })

        expect(bookmarkBefore).not.toBeNull()
        expect(visitsBefore.length).toBe(2)
        expect(tagsBefore.length).toBe(1)
        expect(annotsBefore.length).toBe(1)

        await storageManager.operation(DexieUtilsPlugin.REGEXP_DELETE_OP, {
            collection: 'pages',
            fieldName: 'url',
            pattern: 'com/test2',
        })

        expect(
            await storageManager
                .collection('pages')
                .findObject({ url: DATA.PAGE_1.url }),
        ).toBeNull()
        expect(
            await storageManager
                .collection('pages')
                .findObject({ url: DATA.PAGE_2.url }),
        ).not.toBeNull()
        const bookmarkAfter = await storageManager
            .collection('bookmarks')
            .findObject({ url: DATA.PAGE_1.url })
        const visitsAfter = await storageManager
            .collection('visits')
            .findObjects({ url: DATA.PAGE_1.url })
        const tagsAfter = await storageManager
            .collection('tags')
            .findObjects({ url: DATA.PAGE_1.url })
        const annotsAfter = await storageManager
            .collection('annotations')
            .findObjects({ pageUrl: DATA.PAGE_1.url })

        expect(bookmarkAfter).toBeNull()
        expect(visitsAfter.length).toBe(0)
        expect(tagsAfter.length).toBe(0)
        expect(annotsAfter.length).toBe(0)
    })
})
