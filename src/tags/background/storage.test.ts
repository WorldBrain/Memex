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
