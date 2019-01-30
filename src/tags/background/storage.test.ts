import initStorageManager from '../../search/memory-storex'
import TagsBackground from './'
import * as DATA from './storage.test.data'

describe('Tags', () => {
    let bg: TagsBackground

    async function insertTestData() {
        // Insert some test data for all tests to use
        await bg.addTagsToOpenTabs(DATA.TABS_1)
        await bg.addTag(DATA.TAGS_2)
    }

    beforeEach(async () => {
        const storageManager = initStorageManager()
        bg = new TagsBackground({ storageManager })

        await storageManager.finishInitialization()
        await insertTestData()
    })

    describe('read ops', () => {
        test('fetch page tags', async () => {
            const { urls } = DATA.TABS_1
            for (const url of urls) {
                const tags = await bg.fetchPageTags({ url })
                expect(tags.length).toBe(1)
            }
        })

        test('fetch pages', async () => {
            const pages = await bg.fetchPages({ name: 'lorem' })
            expect(pages.length).toBe(1)
        })
    })

    describe('delete ops', () => {
        test('Remove tags from open tabs', async () => {
            const { urls } = DATA.TABS_1
            await bg.delTagsFromOpenTabs(DATA.TABS_1)
            for (const url of urls) {
                const tags = await bg.fetchPageTags({ url })
                expect(tags.length).toBe(0)
            }
        })
    })
})
