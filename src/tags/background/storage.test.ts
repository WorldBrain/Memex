import * as DATA from './storage.test.data'
import { setupBackgroundIntegrationTest } from 'src/tests/background-integration-tests'
import { BackgroundModules } from 'src/background-script/setup'

describe('Tags background interface', () => {
    async function setupTest(
        initData: (bg: BackgroundModules) => Promise<void> = () => undefined,
    ) {
        const setup = await setupBackgroundIntegrationTest()
        const tagsModule = setup.backgroundModules.tags

        await initData(setup.backgroundModules)

        return { tagsModule }
    }

    describe('BG public interface', () => {
        it('should be able to set tags for a page', async () => {
            const testTags = ['A', 'B', 'C']
            const url = DATA.URL_1

            const { tagsModule } = await setupTest()

            expect(await tagsModule.fetchPageTags({ url })).toEqual([])

            await tagsModule.setTagsForAnnotation({ url, tags: testTags })

            expect(await tagsModule.fetchPageTags({ url })).toEqual(
                expect.arrayContaining(testTags),
            )
        })

        it('should be able to set tags for a page, overwriting existing tags', async () => {
            const testTagsBefore = [DATA.TAGS_1.tag, DATA.TAGS_2.tag]
            const testTagsAfter = ['A', 'B', 'C']
            const url = DATA.URL_1

            const { tagsModule } = await setupTest(async (bg) => {
                await bg.tags.addTagsToExistingUrl({
                    tags: testTagsBefore,
                    url,
                })
            })

            expect(await tagsModule.fetchPageTags({ url })).toEqual(
                expect.arrayContaining(testTagsBefore),
            )

            await tagsModule.setTagsForAnnotation({ url, tags: testTagsAfter })

            expect(await tagsModule.fetchPageTags({ url })).toEqual(
                expect.arrayContaining(testTagsAfter),
            )
        })
    })

    describe('read ops', () => {
        test('fetch page tags', async () => {
            const { tagsModule } = await setupTest(async (bg) => {
                await bg.tags.addTagToExistingUrl(DATA.TAGS_1)
                await bg.tags.addTagToExistingUrl(DATA.TAGS_2)
            })

            const { url } = DATA.TAGS_1
            const tags = await tagsModule.fetchPageTags({ url })
            expect(tags.length).toBe(1)
        })
    })

    describe('delete ops', () => {
        test('Remove tags', async () => {
            const { tagsModule } = await setupTest(async (bg) => {
                await bg.tags.addTagToExistingUrl(DATA.TAGS_1)
                await bg.tags.addTagToExistingUrl(DATA.TAGS_2)
            })

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
