import initStorageManager from '../../search/memory-storex'
import TagsBackground from './'
import * as DATA from './storage.test.data'
import { setupBackgroundIntegrationTest } from 'src/tests/background-integration-tests'

describe('Tags', () => {
    async function setupTest() {
        const setup = await setupBackgroundIntegrationTest()
        const tagsModule = setup.backgroundModules.tags
        await tagsModule.addTagToExistingUrl(DATA.TAGS_1)
        await tagsModule.addTagToExistingUrl(DATA.TAGS_2)
        return { tagsModule }
    }

    describe('read ops', () => {
        test('fetch page tags', async () => {
            const { tagsModule } = await setupTest()
            const { url } = DATA.TAGS_1
            const tags = await tagsModule.fetchPageTags({ url })
            expect(tags.length).toBe(1)
        })
    })

    describe('delete ops', () => {
        test('Remove tags', async () => {
            const { tagsModule } = await setupTest()
            const { tag, url } = DATA.TAGS_1
            await tagsModule.delTag({ tag, url })
            const tags = await tagsModule.fetchPageTags({ url })
            expect(tags.length).toBe(0)
        })
    })
})

describe('Tag Cache', () => {
    async function setupTest() {
        const setup = await setupBackgroundIntegrationTest()
        const tagsModule = setup.backgroundModules.tags
        return { tagsModule }
    }

    describe('modifies cache', () => {
        test('add tags', async () => {
            const { tagsModule } = await setupTest()
            const { tag, url } = DATA.TAGS_1

            await tagsModule.addTagToPage({ tag: DATA.TAGS_1.tag, url })
            expect(await tagsModule.fetchInitialTagSuggestions()).toEqual([
                DATA.TAGS_1.tag,
            ])

            await tagsModule.addTagToPage({ tag: DATA.TAGS_2.tag, url })
            expect(await tagsModule.fetchInitialTagSuggestions()).toEqual([
                DATA.TAGS_2.tag,
                DATA.TAGS_1.tag,
            ])

            await tagsModule.addTagToPage({ tag: DATA.TAGS_1.tag, url })
            expect(await tagsModule.fetchInitialTagSuggestions()).toEqual([
                DATA.TAGS_1.tag,
                DATA.TAGS_2.tag,
            ])

            await tagsModule.addTagToPage({ tag: DATA.TAGS_3.tag, url })
            expect(await tagsModule.fetchInitialTagSuggestions()).toEqual([
                DATA.TAGS_3.tag,
                DATA.TAGS_1.tag,
                DATA.TAGS_2.tag,
            ])
        })
    })
})
