import Storex from '@worldbrain/storex'
import { normalizeUrl } from '@worldbrain/memex-url-utils'

import initStorageManager from '../memory-storex'
import { setStorex } from '../get-db'
import { AnnotationsListPlugin } from './annots-list'
import * as DATA from './annots-search.test.data'
import CustomListBg from 'src/custom-lists/background'
import AnnotsBg from 'src/direct-linking/background'
import { Annotation } from 'src/direct-linking/types'
import { AnnotSearchParams } from './types'

const countAnnots = (res: Map<number, Map<string, Annotation[]>>) => {
    let count = 0
    for (const [, pageMap] of res) {
        for (const [, annots] of pageMap) {
            count += annots.length
        }
    }
    return count
}

// TODO: Make this work somehow...
describe.skip('annots search plugin', () => {
    let annotsBg: AnnotsBg
    let customListsBg: CustomListBg
    let storageManager: Storex

    const search = (
        params: AnnotSearchParams,
    ): Promise<Map<number, Map<string, Annotation[]>>> =>
        storageManager.operation(
            AnnotationsListPlugin.LIST_BY_DAY_OP_ID,
            params,
        )

    async function insertTestData() {
        for (const name of [DATA.LIST1, DATA.LIST2]) {
            await customListsBg.createCustomList({ name })
        }

        for (const { hasBookmark, lists, tags, ...annot } of DATA.ANNOTS) {
            // Pages also need to be seeded to match domains filters against
            await storageManager.collection('pages').createObject({
                url: annot.pageUrl,
                hostname: normalizeUrl(annot.pageUrl),
                domain: normalizeUrl(annot.pageUrl),
                title: annot.pageTitle,
                text: annot.body,
                canonicalUrl: annot.url,
            })

            // Create a dummy visit 30 secs before annot creation time
            await storageManager.collection('visits').createObject({
                url: annot.pageUrl,
                time: new Date(annot.createdWhen.getTime() - 300000).getTime(),
            })

            await annotsBg.createAnnotation({ tab: null }, annot as any) // storageManager.collection('annotations').createObject(annot)

            if (hasBookmark) {
                await annotsBg.toggleAnnotBookmark(
                    { tab: null },
                    { url: annot.url },
                )
            }

            if (lists) {
                for (const listId of lists) {
                    await storageManager
                        .collection('annotListEntries')
                        .createObject({
                            url: annot.url,
                            listId,
                        })
                }
            }

            if (tags) {
                for (const name of tags) {
                    await storageManager.collection('tags').createObject({
                        url: annot.url,
                        name,
                    })
                }
            }
        }
    }

    beforeEach(async () => {
        storageManager = initStorageManager()
        annotsBg = new AnnotsBg({
            storageManager,
            socialBg: {} as any,
            browserAPIs: {} as any,
            pageStorage: {} as any,
            searchIndex: {} as any,
        })
        customListsBg = new CustomListBg({
            storageManager,
            searchIndex: {} as any,
            pageStorage: {} as any,
            localBrowserStorage: {} as any,
        })

        await storageManager.finishInitialization()
        setStorex(storageManager)
        await insertTestData()
    })

    describe('terms search', () => {
        test('test terms', async () => {
            const results = await search({ termsInc: ['english'] })
            expect(countAnnots(results)).toBe(3)
        })
    })
})
