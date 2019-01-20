import initStorageManager from '../../search/memory-storex'
import TagsBackground from './'
import * as DATA from './storage.test.data'
import { getDb } from 'src/search'

describe('Tags', () => {
    let bg: TagsBackground

    async function insertTestData() {
        // Insert some test data for all tests to use
        await bg.addTag(DATA.TAGS_1)
        await bg.addTag(DATA.TAGS_2)
    }

    beforeEach(async () => {
        const storageManager = initStorageManager()
        bg = new TagsBackground({ storageManager, getDb })

        await storageManager.finishInitialization()
        await insertTestData()
    })

    describe('read ops', () => {
        test('fetch page tags', async () => {
            const { url } = DATA.TAGS_1
            const tags = await bg.fetchPageTags({ url })
            expect(tags.length).toBe(1)
        })

        test('fetch pages', async () => {
            const pages = await bg.fetchPages({ name: 'lorem' })
            expect(pages.length).toBe(1)
        })
    })

    describe('delete ops', () => {
        test('Remove tags', async () => {
            const { name, url } = DATA.TAGS_1
            await bg.delTag({ name, url })
            const tags = await bg.fetchPageTags({ url })
            expect(tags.length).toBe(0)
        })
    })
})
