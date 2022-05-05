import Storex from '@worldbrain/storex'
import { normalizeUrl } from '@worldbrain/memex-url-utils'

import { setupBackgroundIntegrationTest } from 'src/tests/background-integration-tests'
import generateTemplateDocs, {
    joinTags,
    joinSpaces,
} from './template-doc-generation'
import { analyzeTemplate } from './utils'
import * as DATA from './template-doc-generation.test.data'
import { getTemplateDataFetchers } from './background/template-data-fetchers'
import { TEST_USER } from '@worldbrain/memex-common/lib/authentication/dev'
import { isShareUrl } from 'src/content-sharing/utils'

async function insertTestData(storageManager: Storex) {
    await storageManager.collection('pages').createObject(DATA.testPageA)
    await storageManager.collection('pages').createObject(DATA.testPageB)
    await storageManager.collection('pages').createObject(DATA.testPageC)

    const spaceNames = new Set<string>([
        ...DATA.testPageASpaces,
        ...DATA.testPageBSpaces,
        ...DATA.testPageCSpaces,
        ...DATA.testAnnotationASpaces,
        ...DATA.testAnnotationBSpaces,
        ...DATA.testAnnotationCSpaces,
        ...DATA.testAnnotationDSpaces,
    ])

    const spaceNamesToIds = new Map<string, number>()
    let listIdCounter = 0
    for (const name of spaceNames) {
        await storageManager.collection('customLists').createObject({
            name,
            id: listIdCounter,
            createdAt: new Date(listIdCounter),
        })
        spaceNamesToIds.set(name, listIdCounter)
        listIdCounter++
    }

    await storageManager.collection('locators').createObject(DATA.testLocatorC)

    await storageManager.collection('annotations').createObject({
        url: DATA.testAnnotationAUrl,
        comment: DATA.testAnnotationAText,
        pageUrl: DATA.testPageA.url,
    })
    await storageManager.collection('annotations').createObject({
        url: DATA.testAnnotationBUrl,
        body: DATA.testAnnotationBHighlight,
        pageUrl: DATA.testPageA.url,
    })
    await storageManager.collection('annotations').createObject({
        url: DATA.testAnnotationCUrl,
        body: DATA.testAnnotationCHighlight,
        pageUrl: DATA.testPageB.url,
    })
    await storageManager.collection('annotations').createObject({
        url: DATA.testAnnotationDUrl,
        body: DATA.testAnnotationDHighlight,
        pageUrl: DATA.testPageC.url,
    })

    const insertTags = (url: string, tags: string[]) =>
        Promise.all(
            tags.map((name) =>
                storageManager.collection('tags').createObject({ url, name }),
            ),
        )
    const insertPageEntries = (fullPageUrl: string, spaces: string[]) =>
        Promise.all(
            spaces.map((name) =>
                storageManager.collection('pageListEntries').createObject({
                    fullUrl: fullPageUrl,
                    pageUrl: normalizeUrl(fullPageUrl),
                    listId: spaceNamesToIds.get(name),
                    createdAt: new Date(),
                }),
            ),
        )
    const insertAnnotEntries = (annotUrl: string, spaces: string[]) =>
        Promise.all(
            spaces.map((name) =>
                storageManager.collection('annotListEntries').createObject({
                    url: annotUrl,
                    listId: spaceNamesToIds.get(name),
                    createdAt: new Date(),
                }),
            ),
        )

    await insertTags(normalizeUrl(DATA.testPageAUrl), DATA.testPageATags)
    await insertTags(normalizeUrl(DATA.testPageBUrl), DATA.testPageBTags)
    await insertTags(normalizeUrl(DATA.testPageCUrl), DATA.testPageCTags)
    await insertTags(DATA.testAnnotationAUrl, DATA.testAnnotationATags)
    await insertTags(DATA.testAnnotationBUrl, DATA.testAnnotationBTags)
    await insertTags(DATA.testAnnotationCUrl, DATA.testAnnotationCTags)
    await insertTags(DATA.testAnnotationDUrl, DATA.testAnnotationDTags)

    await insertPageEntries(DATA.testPageAUrl, DATA.testPageASpaces)
    await insertPageEntries(DATA.testPageBUrl, DATA.testPageBSpaces)
    await insertPageEntries(DATA.testPageCUrl, DATA.testPageCSpaces)

    await insertAnnotEntries(
        DATA.testAnnotationAUrl,
        DATA.testAnnotationASpaces,
    )
    await insertAnnotEntries(
        DATA.testAnnotationBUrl,
        DATA.testAnnotationBSpaces,
    )
    await insertAnnotEntries(
        DATA.testAnnotationCUrl,
        DATA.testAnnotationCSpaces,
    )
    await insertAnnotEntries(
        DATA.testAnnotationDUrl,
        DATA.testAnnotationDSpaces,
    )
}

async function setupTest() {
    const {
        backgroundModules,
        storageManager,
        authService,
    } = await setupBackgroundIntegrationTest()

    authService.setUser(TEST_USER)
    await insertTestData(storageManager)

    return {
        backgroundModules,
        storageManager,
        dataFetchers: getTemplateDataFetchers({
            storageManager,
            contentSharing: backgroundModules.contentSharing,
        }),
    }
}

describe('Content template doc generation', () => {
    it('should correctly generate template docs for a single PDF page + notes + page tags + note tags + page spaces + note spaces', async () => {
        const { dataFetchers } = await setupTest()

        expect(
            await generateTemplateDocs({
                templateAnalysis: analyzeTemplate({
                    code:
                        '{{{PageTitle}}} {{{PageUrl}}} {{{PageTags}}} {{{PageSpaces}}}',
                }),
                normalizedPageUrls: [DATA.testPageC.url],
                annotationUrls: [],
                dataFetchers,
            }),
        ).toEqual([
            {
                PageTitle: DATA.testPageC.fullTitle,
                PageUrl: DATA.testLocatorC.originalLocation,
                PageTags: joinTags(DATA.testPageCTags),
                PageTagList: DATA.testPageCTags,
                PageSpaces: joinSpaces(DATA.testPageCSpaces),
                PageSpaceList: DATA.testPageCSpaces,
                title: DATA.testPageC.fullTitle,
                url: DATA.testLocatorC.originalLocation,
                tags: DATA.testPageCTags,
            },
        ])

        expect(
            await generateTemplateDocs({
                templateAnalysis: analyzeTemplate({
                    code:
                        '{{{PageTitle}}} {{#Notes}} {{{NoteHighlight}}} {{{NoteTags}}} {{{NoteSpaces}}} {{/Notes}}',
                }),
                normalizedPageUrls: [DATA.testPageC.url],
                annotationUrls: [],
                dataFetchers,
            }),
        ).toEqual([
            {
                PageTitle: DATA.testPageC.fullTitle,
                PageUrl: DATA.testLocatorC.originalLocation,
                title: DATA.testPageC.fullTitle,
                url: DATA.testLocatorC.originalLocation,
                Notes: [
                    {
                        NoteHighlight: DATA.testAnnotationDHighlight,
                        NoteTags: joinTags(DATA.testAnnotationDTags),
                        NoteTagList: DATA.testAnnotationDTags,
                        NoteSpaces: joinSpaces(DATA.testAnnotationDSpaces),
                        NoteSpaceList: DATA.testAnnotationDSpaces,
                    },
                ],
            },
        ])
    })

    it('should correctly generate template docs for a single page', async () => {
        const { dataFetchers } = await setupTest()

        expect(
            await generateTemplateDocs({
                templateAnalysis: analyzeTemplate({ code: '{{{PageTitle}}}' }),
                normalizedPageUrls: [DATA.testPageA.url],
                annotationUrls: [],
                dataFetchers,
            }),
        ).toEqual([
            {
                PageTitle: DATA.testPageA.fullTitle,
                PageUrl: DATA.testPageAUrl,
                title: DATA.testPageA.fullTitle,
                url: DATA.testPageAUrl,
            },
        ])

        expect(
            await generateTemplateDocs({
                templateAnalysis: analyzeTemplate({
                    code: '{{{PageTitle}}} {{{PageTags}}} {{{PageSpaces}}}',
                }),
                normalizedPageUrls: [DATA.testPageA.url],
                annotationUrls: [],
                dataFetchers,
            }),
        ).toEqual([
            {
                PageTitle: DATA.testPageA.fullTitle,
                PageUrl: DATA.testPageAUrl,
                PageTags: joinTags(DATA.testPageATags),
                PageTagList: DATA.testPageATags,
                PageSpaces: joinSpaces(DATA.testPageASpaces),
                PageSpaceList: DATA.testPageASpaces,
                title: DATA.testPageA.fullTitle,
                url: DATA.testPageAUrl,
                tags: DATA.testPageATags,
            },
        ])
    })

    it('should correctly generate template docs for a single page, including a page link', async () => {
        const { dataFetchers } = await setupTest()

        const templateDocs = await generateTemplateDocs({
            templateAnalysis: analyzeTemplate({
                code: '{{{PageTitle}}} {{{PageLink}}}',
            }),
            normalizedPageUrls: [DATA.testPageA.url],
            annotationUrls: [],
            dataFetchers,
        })
        expect(templateDocs).toEqual([
            {
                PageLink: expect.any(String), // TODO: properly set once implemented
                PageTitle: DATA.testPageA.fullTitle,
                PageUrl: DATA.testPageAUrl,
                title: DATA.testPageA.fullTitle,
                url: DATA.testPageAUrl,
            },
        ])
        expect(isShareUrl(templateDocs[0].PageLink)).toBe(true)

        expect(
            await generateTemplateDocs({
                templateAnalysis: analyzeTemplate({
                    code: '{{{PageTitle}}} {{{PageLink}}} {{{PageTags}}}',
                }),
                normalizedPageUrls: [DATA.testPageA.url],
                annotationUrls: [],
                dataFetchers,
            }),
        ).toEqual([
            {
                PageLink: expect.any(String), // TODO: properly set once implemented
                PageTitle: DATA.testPageA.fullTitle,
                PageUrl: DATA.testPageAUrl,
                PageTags: joinTags(DATA.testPageATags),
                PageTagList: DATA.testPageATags,
                title: DATA.testPageA.fullTitle,
                url: DATA.testPageAUrl,
                tags: DATA.testPageATags,
            },
        ])
    })

    it('should correctly generate template docs for a single page, with notes references', async () => {
        const { dataFetchers } = await setupTest()

        const generate = (template: string) =>
            generateTemplateDocs({
                templateAnalysis: analyzeTemplate({ code: template }),
                normalizedPageUrls: [DATA.testPageA.url],
                annotationUrls: [],
                dataFetchers,
            })

        expect(
            await generate(
                '{{{PageTitle}}} {{#Notes}}{{{NoteText}}}{{/Notes}}',
            ),
        ).toEqual([
            {
                PageTitle: DATA.testPageA.fullTitle,
                PageUrl: DATA.testPageAUrl,
                title: DATA.testPageA.fullTitle,
                url: DATA.testPageAUrl,
                Notes: [
                    {
                        NoteText: DATA.testAnnotationAText,
                    },
                    {
                        NoteHighlight: DATA.testAnnotationBHighlight,
                    },
                ],
            },
        ])

        expect(
            await generate(
                '{{{PageTitle}}} {{#Notes}}{{{NoteText}}} {{{NoteTags}}} {{{NoteSpaces}}}{{/Notes}}',
            ),
        ).toEqual([
            {
                PageTitle: DATA.testPageA.fullTitle,
                PageUrl: DATA.testPageAUrl,
                title: DATA.testPageA.fullTitle,
                url: DATA.testPageAUrl,
                Notes: [
                    {
                        NoteText: DATA.testAnnotationAText,
                        NoteTags: joinTags(DATA.testAnnotationATags),
                        NoteTagList: DATA.testAnnotationATags,
                        NoteSpaces: joinSpaces(DATA.testAnnotationASpaces),
                        NoteSpaceList: DATA.testAnnotationASpaces,
                    },
                    {
                        NoteHighlight: DATA.testAnnotationBHighlight,
                        NoteTags: joinTags(DATA.testAnnotationBTags),
                        NoteTagList: DATA.testAnnotationBTags,
                        NoteSpaces: joinSpaces(DATA.testAnnotationBSpaces),
                        NoteSpaceList: DATA.testAnnotationBSpaces,
                    },
                ],
            },
        ])

        expect(
            await generate(
                '{{{PageTitle}}} {{#Notes}}{{{NoteText}}} {{{NoteLink}}}{{/Notes}}',
            ),
        ).toEqual([
            {
                PageTitle: DATA.testPageA.fullTitle,
                PageUrl: DATA.testPageAUrl,
                title: DATA.testPageA.fullTitle,
                url: DATA.testPageAUrl,
                Notes: [
                    {
                        NoteText: DATA.testAnnotationAText,
                        NoteLink: expect.any(String), // TODO: properly set once implemented
                    },
                    {
                        NoteHighlight: DATA.testAnnotationBHighlight,
                        NoteLink: expect.any(String), // TODO: properly set once implemented
                    },
                ],
            },
        ])

        expect(
            await generate(
                '{{{PageTitle}}} {{{PageTags}}} {{#Notes}}{{{NoteText}}} {{{NoteLink}}}{{/Notes}}',
            ),
        ).toEqual([
            {
                PageTitle: DATA.testPageA.fullTitle,
                PageUrl: DATA.testPageAUrl,
                PageTags: joinTags(DATA.testPageATags),
                PageTagList: DATA.testPageATags,
                title: DATA.testPageA.fullTitle,
                url: DATA.testPageAUrl,
                tags: DATA.testPageATags,
                Notes: [
                    {
                        NoteText: DATA.testAnnotationAText,
                        NoteLink: expect.any(String), // TODO: properly set once implemented
                    },
                    {
                        NoteHighlight: DATA.testAnnotationBHighlight,
                        NoteLink: expect.any(String), // TODO: properly set once implemented
                    },
                ],
            },
        ])

        expect(
            await generate(
                '{{{PageTitle}}} {{{PageTags}}} {{PageSpaces}} {{{PageLink}}} {{#Notes}}{{{NoteText}}} {{{NoteLink}}}{{/Notes}}',
            ),
        ).toEqual([
            {
                PageTitle: DATA.testPageA.fullTitle,
                PageUrl: DATA.testPageAUrl,
                PageTags: joinTags(DATA.testPageATags),
                PageTagList: DATA.testPageATags,
                PageSpaces: joinSpaces(DATA.testPageASpaces),
                PageSpaceList: DATA.testPageASpaces,
                PageLink: expect.any(String), // TODO: properly set once implemented
                title: DATA.testPageA.fullTitle,
                url: DATA.testPageAUrl,
                tags: DATA.testPageATags,
                Notes: [
                    {
                        NoteText: DATA.testAnnotationAText,
                        NoteLink: expect.any(String), // TODO: properly set once implemented
                    },
                    {
                        NoteHighlight: DATA.testAnnotationBHighlight,
                        NoteLink: expect.any(String), // TODO: properly set once implemented
                    },
                ],
            },
        ])
    })

    it('should correctly generate template docs for multiple pages', async () => {
        const { dataFetchers } = await setupTest()

        const generate = (template: string) =>
            generateTemplateDocs({
                templateAnalysis: analyzeTemplate({ code: template }),
                normalizedPageUrls: [DATA.testPageA.url, DATA.testPageB.url],
                annotationUrls: [],
                dataFetchers,
            })

        expect(await generate('{{#Pages}}{{{PageTitle}}}{{/Pages}}')).toEqual([
            {
                Pages: [
                    {
                        PageTitle: DATA.testPageA.fullTitle,
                        PageUrl: DATA.testPageAUrl,
                        title: DATA.testPageA.fullTitle,
                        url: DATA.testPageAUrl,
                    },
                    {
                        PageTitle: DATA.testPageB.fullTitle,
                        PageUrl: DATA.testPageBUrl,
                        title: DATA.testPageB.fullTitle,
                        url: DATA.testPageBUrl,
                    },
                ],
            },
        ])

        expect(
            await generate(
                '{{#Pages}} {{{PageTitle}}} {{{PageLink}}} {{/Pages}}',
            ),
        ).toEqual([
            {
                Pages: [
                    {
                        PageTitle: DATA.testPageA.fullTitle,
                        PageUrl: DATA.testPageAUrl,
                        PageLink: expect.any(String),
                        title: DATA.testPageA.fullTitle,
                        url: DATA.testPageAUrl,
                    },
                    {
                        PageTitle: DATA.testPageB.fullTitle,
                        PageUrl: DATA.testPageBUrl,
                        PageLink: expect.any(String),
                        title: DATA.testPageB.fullTitle,
                        url: DATA.testPageBUrl,
                    },
                ],
            },
        ])

        expect(
            await generate(
                '{{#Pages}} {{{PageTitle}}} {{{PageTags}}} {{/Pages}}',
            ),
        ).toEqual([
            {
                Pages: [
                    {
                        PageTitle: DATA.testPageA.fullTitle,
                        PageTags: joinTags(DATA.testPageATags),
                        PageTagList: DATA.testPageATags,
                        PageUrl: DATA.testPageAUrl,
                        title: DATA.testPageA.fullTitle,
                        tags: DATA.testPageATags,
                        url: DATA.testPageAUrl,
                    },
                    {
                        PageTitle: DATA.testPageB.fullTitle,
                        PageTags: joinTags(DATA.testPageBTags),
                        PageTagList: DATA.testPageBTags,
                        PageUrl: DATA.testPageBUrl,
                        title: DATA.testPageB.fullTitle,
                        tags: DATA.testPageBTags,
                        url: DATA.testPageBUrl,
                    },
                ],
            },
        ])

        expect(
            await generate(
                '{{#Pages}} {{{PageTitle}}} {{{PageSpaces}}} {{/Pages}}',
            ),
        ).toEqual([
            {
                Pages: [
                    {
                        PageTitle: DATA.testPageA.fullTitle,
                        PageSpaces: joinSpaces(DATA.testPageASpaces),
                        PageSpaceList: DATA.testPageASpaces,
                        PageUrl: DATA.testPageAUrl,
                        title: DATA.testPageA.fullTitle,
                        url: DATA.testPageAUrl,
                    },
                    {
                        PageTitle: DATA.testPageB.fullTitle,
                        PageSpaces: joinSpaces(DATA.testPageBSpaces),
                        PageSpaceList: DATA.testPageBSpaces,
                        PageUrl: DATA.testPageBUrl,
                        title: DATA.testPageB.fullTitle,
                        url: DATA.testPageBUrl,
                    },
                ],
            },
        ])

        expect(
            await generate(
                '{{#Pages}} {{{PageTitle}}} {{{PageTags}}} {{{PageLink}}} {{/Pages}}',
            ),
        ).toEqual([
            {
                Pages: [
                    {
                        PageTitle: DATA.testPageA.fullTitle,
                        PageTags: joinTags(DATA.testPageATags),
                        PageTagList: DATA.testPageATags,
                        PageUrl: DATA.testPageAUrl,
                        PageLink: expect.any(String),
                        title: DATA.testPageA.fullTitle,
                        tags: DATA.testPageATags,
                        url: DATA.testPageAUrl,
                    },
                    {
                        PageTitle: DATA.testPageB.fullTitle,
                        PageTags: joinTags(DATA.testPageBTags),
                        PageTagList: DATA.testPageBTags,
                        PageUrl: DATA.testPageBUrl,
                        PageLink: expect.any(String),
                        title: DATA.testPageB.fullTitle,
                        tags: DATA.testPageBTags,
                        url: DATA.testPageBUrl,
                    },
                ],
            },
        ])

        expect(
            await generate(
                '{{#Pages}} {{{PageTitle}}} {{{PageSpaces}}} {{{PageLink}}} {{/Pages}}',
            ),
        ).toEqual([
            {
                Pages: [
                    {
                        PageTitle: DATA.testPageA.fullTitle,
                        PageSpaces: joinSpaces(DATA.testPageASpaces),
                        PageSpaceList: DATA.testPageASpaces,
                        PageUrl: DATA.testPageAUrl,
                        PageLink: expect.any(String),
                        title: DATA.testPageA.fullTitle,
                        url: DATA.testPageAUrl,
                    },
                    {
                        PageTitle: DATA.testPageB.fullTitle,
                        PageSpaces: joinSpaces(DATA.testPageBSpaces),
                        PageSpaceList: DATA.testPageBSpaces,
                        PageUrl: DATA.testPageBUrl,
                        PageLink: expect.any(String),
                        title: DATA.testPageB.fullTitle,
                        url: DATA.testPageBUrl,
                    },
                ],
            },
        ])
    })

    it('should correctly generate template docs for multiple pages, but only referencing top-level page vars', async () => {
        const { dataFetchers } = await setupTest()

        const generate = (template: string) =>
            generateTemplateDocs({
                templateAnalysis: analyzeTemplate({ code: template }),
                normalizedPageUrls: [DATA.testPageA.url, DATA.testPageB.url],
                annotationUrls: [],
                dataFetchers,
            })

        expect(await generate('{{{PageTitle}}}')).toEqual([
            {
                PageTitle: DATA.testPageA.fullTitle,
                PageUrl: DATA.testPageAUrl,
                title: DATA.testPageA.fullTitle,
                url: DATA.testPageAUrl,
            },
            {
                PageTitle: DATA.testPageB.fullTitle,
                PageUrl: DATA.testPageBUrl,
                title: DATA.testPageB.fullTitle,
                url: DATA.testPageBUrl,
            },
        ])

        expect(await generate('{{{PageTitle}}} {{{PageTags}}}')).toEqual([
            {
                PageTitle: DATA.testPageA.fullTitle,
                PageTags: joinTags(DATA.testPageATags),
                PageTagList: DATA.testPageATags,
                PageUrl: DATA.testPageAUrl,
                title: DATA.testPageA.fullTitle,
                tags: DATA.testPageATags,
                url: DATA.testPageAUrl,
            },
            {
                PageTitle: DATA.testPageB.fullTitle,
                PageTags: joinTags(DATA.testPageBTags),
                PageTagList: DATA.testPageBTags,
                PageUrl: DATA.testPageBUrl,
                title: DATA.testPageB.fullTitle,
                tags: DATA.testPageBTags,
                url: DATA.testPageBUrl,
            },
        ])

        expect(await generate('{{{PageTitle}}} {{{PageSpaces}}}')).toEqual([
            {
                PageTitle: DATA.testPageA.fullTitle,
                PageSpaces: joinSpaces(DATA.testPageASpaces),
                PageSpaceList: DATA.testPageASpaces,
                PageUrl: DATA.testPageAUrl,
                title: DATA.testPageA.fullTitle,
                url: DATA.testPageAUrl,
            },
            {
                PageTitle: DATA.testPageB.fullTitle,
                PageSpaces: joinSpaces(DATA.testPageBSpaces),
                PageSpaceList: DATA.testPageBSpaces,
                PageUrl: DATA.testPageBUrl,
                title: DATA.testPageB.fullTitle,
                url: DATA.testPageBUrl,
            },
        ])

        expect(await generate('{{{PageTitle}}} {{{PageLink}}}')).toEqual([
            {
                PageTitle: DATA.testPageA.fullTitle,
                PageUrl: DATA.testPageAUrl,
                PageLink: expect.any(String),
                title: DATA.testPageA.fullTitle,
                url: DATA.testPageAUrl,
            },
            {
                PageTitle: DATA.testPageB.fullTitle,
                PageUrl: DATA.testPageBUrl,
                PageLink: expect.any(String),
                title: DATA.testPageB.fullTitle,
                url: DATA.testPageBUrl,
            },
        ])

        expect(
            await generate('{{{PageTitle}}} {{{PageTags}}} {{{PageLink}}}'),
        ).toEqual([
            {
                PageTitle: DATA.testPageA.fullTitle,
                PageTags: joinTags(DATA.testPageATags),
                PageTagList: DATA.testPageATags,
                PageUrl: DATA.testPageAUrl,
                PageLink: expect.any(String),
                title: DATA.testPageA.fullTitle,
                tags: DATA.testPageATags,
                url: DATA.testPageAUrl,
            },
            {
                PageTitle: DATA.testPageB.fullTitle,
                PageTags: joinTags(DATA.testPageBTags),
                PageTagList: DATA.testPageBTags,
                PageUrl: DATA.testPageBUrl,
                PageLink: expect.any(String),
                title: DATA.testPageB.fullTitle,
                tags: DATA.testPageBTags,
                url: DATA.testPageBUrl,
            },
        ])
    })

    it('should correctly generate template docs for multiple pages, with note references', async () => {
        const { dataFetchers } = await setupTest()

        const generate = (template: string) =>
            generateTemplateDocs({
                templateAnalysis: analyzeTemplate({ code: template }),
                normalizedPageUrls: [DATA.testPageA.url, DATA.testPageB.url],
                annotationUrls: [
                    DATA.testAnnotationAUrl,
                    DATA.testAnnotationBUrl,
                    DATA.testAnnotationCUrl,
                ],
                dataFetchers,
            })

        expect(
            await generate(
                '{{#Pages}} {{{PageTitle}}} {{{PageTags}}} {{{PageSpaces}}} {{{PageLink}}} {{#Notes}} {{{NoteHighlight}}} {{{NoteTags}}} {{{NoteSpaces}}} {{{NoteLink}}} {{/Notes}} {{/Pages}}',
            ),
        ).toEqual([
            {
                Pages: [
                    {
                        PageTitle: DATA.testPageA.fullTitle,
                        PageTags: joinTags(DATA.testPageATags),
                        PageTagList: DATA.testPageATags,
                        PageSpaces: joinSpaces(DATA.testPageASpaces),
                        PageSpaceList: DATA.testPageASpaces,
                        PageUrl: DATA.testPageAUrl,
                        PageLink: expect.any(String),
                        title: DATA.testPageA.fullTitle,
                        tags: DATA.testPageATags,
                        url: DATA.testPageAUrl,
                        Notes: [
                            {
                                NoteText: DATA.testAnnotationAText,
                                NoteTags: joinTags(DATA.testAnnotationATags),
                                NoteTagList: DATA.testAnnotationATags,
                                NoteSpaces: joinSpaces(
                                    DATA.testAnnotationASpaces,
                                ),
                                NoteSpaceList: DATA.testAnnotationASpaces,
                                NoteLink: expect.any(String),
                                PageTitle: DATA.testPageA.fullTitle,
                                PageTags: joinTags(DATA.testPageATags),
                                PageTagList: DATA.testPageATags,
                                PageSpaces: joinSpaces(DATA.testPageASpaces),
                                PageSpaceList: DATA.testPageASpaces,
                                PageUrl: DATA.testPageAUrl,
                                PageLink: expect.any(String),
                                title: DATA.testPageA.fullTitle,
                                tags: DATA.testPageATags,
                                url: DATA.testPageAUrl,
                            },
                            {
                                NoteHighlight: DATA.testAnnotationBHighlight,
                                NoteTags: joinTags(DATA.testAnnotationBTags),
                                NoteTagList: DATA.testAnnotationBTags,
                                NoteSpaces: joinSpaces(
                                    DATA.testAnnotationBSpaces,
                                ),
                                NoteSpaceList: DATA.testAnnotationBSpaces,
                                NoteLink: expect.any(String),
                                PageTitle: DATA.testPageA.fullTitle,
                                PageTags: joinTags(DATA.testPageATags),
                                PageTagList: DATA.testPageATags,
                                PageSpaces: joinSpaces(DATA.testPageASpaces),
                                PageSpaceList: DATA.testPageASpaces,
                                PageUrl: DATA.testPageAUrl,
                                PageLink: expect.any(String),
                                title: DATA.testPageA.fullTitle,
                                tags: DATA.testPageATags,
                                url: DATA.testPageAUrl,
                            },
                        ],
                    },
                    {
                        PageTitle: DATA.testPageB.fullTitle,
                        PageTags: joinTags(DATA.testPageBTags),
                        PageTagList: DATA.testPageBTags,
                        PageSpaces: joinSpaces(DATA.testPageBSpaces),
                        PageSpaceList: DATA.testPageBSpaces,
                        PageUrl: DATA.testPageBUrl,
                        PageLink: expect.any(String),
                        title: DATA.testPageB.fullTitle,
                        tags: DATA.testPageBTags,
                        url: DATA.testPageBUrl,
                        Notes: [
                            {
                                NoteHighlight: DATA.testAnnotationCHighlight,
                                NoteTags: joinTags(DATA.testAnnotationCTags),
                                NoteTagList: DATA.testAnnotationCTags,
                                // NOTE: these should be excluded as this annot isn't a part of any spaces
                                // NoteSpaces: joinSpaces(
                                //     DATA.testAnnotationCSpaces,
                                // ),
                                // NoteSpaceList: DATA.testAnnotationCSpaces,
                                NoteLink: expect.any(String),
                                PageTitle: DATA.testPageB.fullTitle,
                                PageTags: joinTags(DATA.testPageBTags),
                                PageTagList: DATA.testPageBTags,
                                PageSpaces: joinSpaces(DATA.testPageBSpaces),
                                PageSpaceList: DATA.testPageBSpaces,
                                PageUrl: DATA.testPageBUrl,
                                PageLink: expect.any(String),
                                title: DATA.testPageB.fullTitle,
                                tags: DATA.testPageBTags,
                                url: DATA.testPageBUrl,
                            },
                        ],
                    },
                ],
            },
        ])

        expect(
            await generate(
                '{{#Pages}} {{{PageTitle}}} {{{PageTags}}} {{{PageLink}}} {{#Notes}} {{{NoteHighlight}}} {{{NoteLink}}} {{/Notes}} {{/Pages}}',
            ),
        ).toEqual([
            {
                Pages: [
                    {
                        PageTitle: DATA.testPageA.fullTitle,
                        PageTags: joinTags(DATA.testPageATags),
                        PageTagList: DATA.testPageATags,
                        PageUrl: DATA.testPageAUrl,
                        PageLink: expect.any(String),
                        title: DATA.testPageA.fullTitle,
                        tags: DATA.testPageATags,
                        url: DATA.testPageAUrl,
                        Notes: [
                            {
                                NoteText: DATA.testAnnotationAText,
                                NoteLink: expect.any(String),
                                PageTitle: DATA.testPageA.fullTitle,
                                PageTags: joinTags(DATA.testPageATags),
                                PageTagList: DATA.testPageATags,
                                PageUrl: DATA.testPageAUrl,
                                PageLink: expect.any(String),
                                title: DATA.testPageA.fullTitle,
                                tags: DATA.testPageATags,
                                url: DATA.testPageAUrl,
                            },
                            {
                                NoteHighlight: DATA.testAnnotationBHighlight,
                                NoteLink: expect.any(String),
                                PageTitle: DATA.testPageA.fullTitle,
                                PageTags: joinTags(DATA.testPageATags),
                                PageTagList: DATA.testPageATags,
                                PageUrl: DATA.testPageAUrl,
                                PageLink: expect.any(String),
                                title: DATA.testPageA.fullTitle,
                                tags: DATA.testPageATags,
                                url: DATA.testPageAUrl,
                            },
                        ],
                    },
                    {
                        PageTitle: DATA.testPageB.fullTitle,
                        PageTags: joinTags(DATA.testPageBTags),
                        PageTagList: DATA.testPageBTags,
                        PageUrl: DATA.testPageBUrl,
                        PageLink: expect.any(String),
                        title: DATA.testPageB.fullTitle,
                        tags: DATA.testPageBTags,
                        url: DATA.testPageBUrl,
                        Notes: [
                            {
                                NoteHighlight: DATA.testAnnotationCHighlight,
                                NoteLink: expect.any(String),
                                PageTitle: DATA.testPageB.fullTitle,
                                PageTags: joinTags(DATA.testPageBTags),
                                PageTagList: DATA.testPageBTags,
                                PageUrl: DATA.testPageBUrl,
                                PageLink: expect.any(String),
                                title: DATA.testPageB.fullTitle,
                                tags: DATA.testPageBTags,
                                url: DATA.testPageBUrl,
                            },
                        ],
                    },
                ],
            },
        ])

        expect(
            await generate(
                '{{#Pages}} {{{PageTitle}}} {{{PageTags}}} {{{PageLink}}} {{#Notes}} {{{NoteHighlight}}} {{/Notes}} {{/Pages}}',
            ),
        ).toEqual([
            {
                Pages: [
                    {
                        PageTitle: DATA.testPageA.fullTitle,
                        PageTags: joinTags(DATA.testPageATags),
                        PageTagList: DATA.testPageATags,
                        PageUrl: DATA.testPageAUrl,
                        PageLink: expect.any(String),
                        title: DATA.testPageA.fullTitle,
                        tags: DATA.testPageATags,
                        url: DATA.testPageAUrl,
                        Notes: [
                            {
                                NoteText: DATA.testAnnotationAText,
                                PageTitle: DATA.testPageA.fullTitle,
                                PageTags: joinTags(DATA.testPageATags),
                                PageTagList: DATA.testPageATags,
                                PageUrl: DATA.testPageAUrl,
                                PageLink: expect.any(String),
                                title: DATA.testPageA.fullTitle,
                                tags: DATA.testPageATags,
                                url: DATA.testPageAUrl,
                            },
                            {
                                NoteHighlight: DATA.testAnnotationBHighlight,
                                PageTitle: DATA.testPageA.fullTitle,
                                PageTags: joinTags(DATA.testPageATags),
                                PageTagList: DATA.testPageATags,
                                PageUrl: DATA.testPageAUrl,
                                PageLink: expect.any(String),
                                title: DATA.testPageA.fullTitle,
                                tags: DATA.testPageATags,
                                url: DATA.testPageAUrl,
                            },
                        ],
                    },
                    {
                        PageTitle: DATA.testPageB.fullTitle,
                        PageTags: joinTags(DATA.testPageBTags),
                        PageTagList: DATA.testPageBTags,
                        PageUrl: DATA.testPageBUrl,
                        PageLink: expect.any(String),
                        title: DATA.testPageB.fullTitle,
                        tags: DATA.testPageBTags,
                        url: DATA.testPageBUrl,
                        Notes: [
                            {
                                NoteHighlight: DATA.testAnnotationCHighlight,
                                PageTitle: DATA.testPageB.fullTitle,
                                PageTags: joinTags(DATA.testPageBTags),
                                PageTagList: DATA.testPageBTags,
                                PageUrl: DATA.testPageBUrl,
                                PageLink: expect.any(String),
                                title: DATA.testPageB.fullTitle,
                                tags: DATA.testPageBTags,
                                url: DATA.testPageBUrl,
                            },
                        ],
                    },
                ],
            },
        ])

        expect(
            await generate(
                '{{#Pages}} {{{PageTitle}}} {{{PageLink}}} {{#Notes}} {{{NoteHighlight}}} {{/Notes}} {{/Pages}}',
            ),
        ).toEqual([
            {
                Pages: [
                    {
                        PageTitle: DATA.testPageA.fullTitle,
                        PageUrl: DATA.testPageAUrl,
                        PageLink: expect.any(String),
                        title: DATA.testPageA.fullTitle,
                        url: DATA.testPageAUrl,
                        Notes: [
                            {
                                NoteText: DATA.testAnnotationAText,
                                PageTitle: DATA.testPageA.fullTitle,
                                PageUrl: DATA.testPageAUrl,
                                PageLink: expect.any(String),
                                title: DATA.testPageA.fullTitle,
                                url: DATA.testPageAUrl,
                            },
                            {
                                NoteHighlight: DATA.testAnnotationBHighlight,
                                PageTitle: DATA.testPageA.fullTitle,
                                PageUrl: DATA.testPageAUrl,
                                PageLink: expect.any(String),
                                title: DATA.testPageA.fullTitle,
                                url: DATA.testPageAUrl,
                            },
                        ],
                    },
                    {
                        PageTitle: DATA.testPageB.fullTitle,
                        PageUrl: DATA.testPageBUrl,
                        PageLink: expect.any(String),
                        title: DATA.testPageB.fullTitle,
                        url: DATA.testPageBUrl,
                        Notes: [
                            {
                                NoteHighlight: DATA.testAnnotationCHighlight,
                                PageTitle: DATA.testPageB.fullTitle,
                                PageUrl: DATA.testPageBUrl,
                                PageLink: expect.any(String),
                                title: DATA.testPageB.fullTitle,
                                url: DATA.testPageBUrl,
                            },
                        ],
                    },
                ],
            },
        ])

        expect(
            await generate(
                '{{#Pages}} {{{PageTitle}}} {{#Notes}} {{{NoteHighlight}}} {{/Notes}} {{/Pages}}',
            ),
        ).toEqual([
            {
                Pages: [
                    {
                        PageTitle: DATA.testPageA.fullTitle,
                        PageUrl: DATA.testPageAUrl,
                        title: DATA.testPageA.fullTitle,
                        url: DATA.testPageAUrl,
                        Notes: [
                            {
                                NoteText: DATA.testAnnotationAText,
                                PageTitle: DATA.testPageA.fullTitle,
                                PageUrl: DATA.testPageAUrl,
                                title: DATA.testPageA.fullTitle,
                                url: DATA.testPageAUrl,
                            },
                            {
                                NoteHighlight: DATA.testAnnotationBHighlight,
                                PageTitle: DATA.testPageA.fullTitle,
                                PageUrl: DATA.testPageAUrl,
                                title: DATA.testPageA.fullTitle,
                                url: DATA.testPageAUrl,
                            },
                        ],
                    },
                    {
                        PageTitle: DATA.testPageB.fullTitle,
                        PageUrl: DATA.testPageBUrl,
                        title: DATA.testPageB.fullTitle,
                        url: DATA.testPageBUrl,
                        Notes: [
                            {
                                NoteHighlight: DATA.testAnnotationCHighlight,
                                PageTitle: DATA.testPageB.fullTitle,
                                PageUrl: DATA.testPageBUrl,
                                title: DATA.testPageB.fullTitle,
                                url: DATA.testPageBUrl,
                            },
                        ],
                    },
                ],
            },
        ])
    })

    it('should correctly generate template docs for multiple pages, with note references but only referencing top-level page vars', async () => {
        const { dataFetchers } = await setupTest()

        const generate = (template: string) =>
            generateTemplateDocs({
                templateAnalysis: analyzeTemplate({ code: template }),
                normalizedPageUrls: [DATA.testPageA.url, DATA.testPageB.url],
                annotationUrls: [
                    DATA.testAnnotationAUrl,
                    DATA.testAnnotationBUrl,
                    DATA.testAnnotationCUrl,
                ],
                dataFetchers,
            })

        expect(
            await generate(
                '{{{PageTitle}}} {{#Notes}} {{{NoteHighlight}}} {{/Notes}}',
            ),
        ).toEqual([
            {
                PageTitle: DATA.testPageA.fullTitle,
                PageUrl: DATA.testPageAUrl,
                title: DATA.testPageA.fullTitle,
                url: DATA.testPageAUrl,
                Notes: [
                    {
                        NoteText: DATA.testAnnotationAText,
                        PageTitle: DATA.testPageA.fullTitle,
                        PageUrl: DATA.testPageAUrl,
                        title: DATA.testPageA.fullTitle,
                        url: DATA.testPageAUrl,
                    },
                    {
                        NoteHighlight: DATA.testAnnotationBHighlight,
                        PageTitle: DATA.testPageA.fullTitle,
                        PageUrl: DATA.testPageAUrl,
                        title: DATA.testPageA.fullTitle,
                        url: DATA.testPageAUrl,
                    },
                ],
            },
            {
                PageTitle: DATA.testPageB.fullTitle,
                PageUrl: DATA.testPageBUrl,
                title: DATA.testPageB.fullTitle,
                url: DATA.testPageBUrl,
                Notes: [
                    {
                        PageTitle: DATA.testPageB.fullTitle,
                        PageUrl: DATA.testPageBUrl,
                        title: DATA.testPageB.fullTitle,
                        url: DATA.testPageBUrl,
                        NoteHighlight: DATA.testAnnotationCHighlight,
                    },
                ],
            },
        ])

        expect(
            await generate(
                '{{{PageTitle}}} {{{PageLink}}} {{#Notes}} {{{NoteHighlight}}} {{/Notes}}',
            ),
        ).toEqual([
            {
                PageTitle: DATA.testPageA.fullTitle,
                PageUrl: DATA.testPageAUrl,
                PageLink: expect.any(String),
                title: DATA.testPageA.fullTitle,
                url: DATA.testPageAUrl,
                Notes: [
                    {
                        PageTitle: DATA.testPageA.fullTitle,
                        PageUrl: DATA.testPageAUrl,
                        PageLink: expect.any(String),
                        title: DATA.testPageA.fullTitle,
                        url: DATA.testPageAUrl,
                        NoteText: DATA.testAnnotationAText,
                    },
                    {
                        PageTitle: DATA.testPageA.fullTitle,
                        PageUrl: DATA.testPageAUrl,
                        PageLink: expect.any(String),
                        title: DATA.testPageA.fullTitle,
                        url: DATA.testPageAUrl,
                        NoteHighlight: DATA.testAnnotationBHighlight,
                    },
                ],
            },
            {
                PageTitle: DATA.testPageB.fullTitle,
                PageUrl: DATA.testPageBUrl,
                PageLink: expect.any(String),
                title: DATA.testPageB.fullTitle,
                url: DATA.testPageBUrl,
                Notes: [
                    {
                        PageTitle: DATA.testPageB.fullTitle,
                        PageUrl: DATA.testPageBUrl,
                        PageLink: expect.any(String),
                        title: DATA.testPageB.fullTitle,
                        url: DATA.testPageBUrl,
                        NoteHighlight: DATA.testAnnotationCHighlight,
                    },
                ],
            },
        ])

        expect(
            await generate(
                '{{{PageTitle}}} {{{PageTags}}} {{{PageLink}}} {{#Notes}} {{{NoteHighlight}}} {{/Notes}}',
            ),
        ).toEqual([
            {
                PageTitle: DATA.testPageA.fullTitle,
                PageTags: joinTags(DATA.testPageATags),
                PageTagList: DATA.testPageATags,
                PageUrl: DATA.testPageAUrl,
                PageLink: expect.any(String),
                title: DATA.testPageA.fullTitle,
                tags: DATA.testPageATags,
                url: DATA.testPageAUrl,
                Notes: [
                    {
                        PageTitle: DATA.testPageA.fullTitle,
                        PageTags: joinTags(DATA.testPageATags),
                        PageTagList: DATA.testPageATags,
                        PageUrl: DATA.testPageAUrl,
                        PageLink: expect.any(String),
                        title: DATA.testPageA.fullTitle,
                        tags: DATA.testPageATags,
                        url: DATA.testPageAUrl,
                        NoteText: DATA.testAnnotationAText,
                    },
                    {
                        PageTitle: DATA.testPageA.fullTitle,
                        PageTags: joinTags(DATA.testPageATags),
                        PageTagList: DATA.testPageATags,
                        PageUrl: DATA.testPageAUrl,
                        PageLink: expect.any(String),
                        title: DATA.testPageA.fullTitle,
                        tags: DATA.testPageATags,
                        url: DATA.testPageAUrl,
                        NoteHighlight: DATA.testAnnotationBHighlight,
                    },
                ],
            },
            {
                PageTitle: DATA.testPageB.fullTitle,
                PageTags: joinTags(DATA.testPageBTags),
                PageTagList: DATA.testPageBTags,
                PageUrl: DATA.testPageBUrl,
                PageLink: expect.any(String),
                title: DATA.testPageB.fullTitle,
                tags: DATA.testPageBTags,
                url: DATA.testPageBUrl,
                Notes: [
                    {
                        PageTitle: DATA.testPageB.fullTitle,
                        PageTags: joinTags(DATA.testPageBTags),
                        PageTagList: DATA.testPageBTags,
                        PageUrl: DATA.testPageBUrl,
                        PageLink: expect.any(String),
                        title: DATA.testPageB.fullTitle,
                        tags: DATA.testPageBTags,
                        url: DATA.testPageBUrl,
                        NoteHighlight: DATA.testAnnotationCHighlight,
                    },
                ],
            },
        ])

        expect(
            await generate(
                '{{{PageTitle}}} {{{PageTags}}} {{{PageLink}}} {{#Notes}} {{{NoteHighlight}}} {{{NoteLink}}} {{/Notes}}',
            ),
        ).toEqual([
            {
                PageTitle: DATA.testPageA.fullTitle,
                PageTags: joinTags(DATA.testPageATags),
                PageTagList: DATA.testPageATags,
                PageUrl: DATA.testPageAUrl,
                PageLink: expect.any(String),
                title: DATA.testPageA.fullTitle,
                tags: DATA.testPageATags,
                url: DATA.testPageAUrl,
                Notes: [
                    {
                        PageTitle: DATA.testPageA.fullTitle,
                        PageTags: joinTags(DATA.testPageATags),
                        PageTagList: DATA.testPageATags,
                        PageUrl: DATA.testPageAUrl,
                        PageLink: expect.any(String),
                        title: DATA.testPageA.fullTitle,
                        tags: DATA.testPageATags,
                        url: DATA.testPageAUrl,
                        NoteText: DATA.testAnnotationAText,
                        NoteLink: expect.any(String),
                    },
                    {
                        PageTitle: DATA.testPageA.fullTitle,
                        PageTags: joinTags(DATA.testPageATags),
                        PageTagList: DATA.testPageATags,
                        PageUrl: DATA.testPageAUrl,
                        PageLink: expect.any(String),
                        title: DATA.testPageA.fullTitle,
                        tags: DATA.testPageATags,
                        url: DATA.testPageAUrl,
                        NoteHighlight: DATA.testAnnotationBHighlight,
                        NoteLink: expect.any(String),
                    },
                ],
            },
            {
                PageTitle: DATA.testPageB.fullTitle,
                PageTags: joinTags(DATA.testPageBTags),
                PageTagList: DATA.testPageBTags,
                PageUrl: DATA.testPageBUrl,
                PageLink: expect.any(String),
                title: DATA.testPageB.fullTitle,
                tags: DATA.testPageBTags,
                url: DATA.testPageBUrl,
                Notes: [
                    {
                        PageTitle: DATA.testPageB.fullTitle,
                        PageTags: joinTags(DATA.testPageBTags),
                        PageTagList: DATA.testPageBTags,
                        PageUrl: DATA.testPageBUrl,
                        PageLink: expect.any(String),
                        title: DATA.testPageB.fullTitle,
                        tags: DATA.testPageBTags,
                        url: DATA.testPageBUrl,
                        NoteHighlight: DATA.testAnnotationCHighlight,
                        NoteLink: expect.any(String),
                    },
                ],
            },
        ])

        expect(
            await generate(
                '{{{PageTitle}}} {{{PageTags}}} {{{PageSpaces}}} {{{PageLink}}} {{#Notes}} {{{NoteHighlight}}} {{{NoteTags}}} {{{NoteSpaces}}} {{{NoteLink}}} {{/Notes}}',
            ),
        ).toEqual([
            {
                PageTitle: DATA.testPageA.fullTitle,
                PageTags: joinTags(DATA.testPageATags),
                PageTagList: DATA.testPageATags,
                PageSpaces: joinSpaces(DATA.testPageASpaces),
                PageSpaceList: DATA.testPageASpaces,
                PageUrl: DATA.testPageAUrl,
                PageLink: expect.any(String),
                title: DATA.testPageA.fullTitle,
                tags: DATA.testPageATags,
                url: DATA.testPageAUrl,
                Notes: [
                    {
                        PageTitle: DATA.testPageA.fullTitle,
                        PageTags: joinTags(DATA.testPageATags),
                        PageTagList: DATA.testPageATags,
                        PageSpaces: joinSpaces(DATA.testPageASpaces),
                        PageSpaceList: DATA.testPageASpaces,
                        PageUrl: DATA.testPageAUrl,
                        PageLink: expect.any(String),
                        title: DATA.testPageA.fullTitle,
                        tags: DATA.testPageATags,
                        url: DATA.testPageAUrl,
                        NoteText: DATA.testAnnotationAText,
                        NoteTags: joinTags(DATA.testAnnotationATags),
                        NoteTagList: DATA.testAnnotationATags,
                        NoteSpaces: joinSpaces(DATA.testAnnotationASpaces),
                        NoteSpaceList: DATA.testAnnotationASpaces,
                        NoteLink: expect.any(String),
                    },
                    {
                        PageTitle: DATA.testPageA.fullTitle,
                        PageTags: joinTags(DATA.testPageATags),
                        PageTagList: DATA.testPageATags,
                        PageSpaces: joinSpaces(DATA.testPageASpaces),
                        PageSpaceList: DATA.testPageASpaces,
                        PageUrl: DATA.testPageAUrl,
                        PageLink: expect.any(String),
                        title: DATA.testPageA.fullTitle,
                        tags: DATA.testPageATags,
                        url: DATA.testPageAUrl,
                        NoteHighlight: DATA.testAnnotationBHighlight,
                        NoteTags: joinTags(DATA.testAnnotationBTags),
                        NoteTagList: DATA.testAnnotationBTags,
                        NoteSpaces: joinSpaces(DATA.testAnnotationBSpaces),
                        NoteSpaceList: DATA.testAnnotationBSpaces,
                        NoteLink: expect.any(String),
                    },
                ],
            },
            {
                PageTitle: DATA.testPageB.fullTitle,
                PageTags: joinTags(DATA.testPageBTags),
                PageTagList: DATA.testPageBTags,
                PageSpaces: joinSpaces(DATA.testPageBSpaces),
                PageSpaceList: DATA.testPageBSpaces,
                PageUrl: DATA.testPageBUrl,
                PageLink: expect.any(String),
                title: DATA.testPageB.fullTitle,
                tags: DATA.testPageBTags,
                url: DATA.testPageBUrl,
                Notes: [
                    {
                        PageTitle: DATA.testPageB.fullTitle,
                        PageTags: joinTags(DATA.testPageBTags),
                        PageTagList: DATA.testPageBTags,
                        PageSpaces: joinSpaces(DATA.testPageBSpaces),
                        PageSpaceList: DATA.testPageBSpaces,
                        PageUrl: DATA.testPageBUrl,
                        PageLink: expect.any(String),
                        title: DATA.testPageB.fullTitle,
                        tags: DATA.testPageBTags,
                        url: DATA.testPageBUrl,
                        NoteHighlight: DATA.testAnnotationCHighlight,
                        NoteTags: joinTags(DATA.testAnnotationCTags),
                        NoteTagList: DATA.testAnnotationCTags,
                        // NoteSpaces: joinSpaces(DATA.testAnnotationCSpaces),
                        // NoteSpaceList: DATA.testAnnotationCSpaces,
                        NoteLink: expect.any(String),
                    },
                ],
            },
        ])
    })

    it('should correctly generate template docs for multiple pages, with note references but referencing top-level page AND note vars', async () => {
        const { dataFetchers } = await setupTest()

        const generate = (template: string) =>
            generateTemplateDocs({
                templateAnalysis: analyzeTemplate({ code: template }),
                normalizedPageUrls: [DATA.testPageA.url, DATA.testPageB.url],
                annotationUrls: [
                    DATA.testAnnotationAUrl,
                    DATA.testAnnotationBUrl,
                    DATA.testAnnotationCUrl,
                ],
                dataFetchers,
            })

        expect(await generate('{{{NoteText}}} {{{PageTitle}}}')).toEqual([
            {
                PageTitle: DATA.testPageA.fullTitle,
                PageUrl: DATA.testPageAUrl,
                title: DATA.testPageA.fullTitle,
                url: DATA.testPageAUrl,
                NoteText: DATA.testAnnotationAText,
            },
            {
                PageTitle: DATA.testPageA.fullTitle,
                PageUrl: DATA.testPageAUrl,
                title: DATA.testPageA.fullTitle,
                url: DATA.testPageAUrl,
                NoteHighlight: DATA.testAnnotationBHighlight,
            },
            {
                PageTitle: DATA.testPageB.fullTitle,
                PageUrl: DATA.testPageBUrl,
                title: DATA.testPageB.fullTitle,
                url: DATA.testPageBUrl,
                NoteHighlight: DATA.testAnnotationCHighlight,
            },
        ])
    })

    it('should correctly generate template docs for single annotation, but only with page references', async () => {
        const { dataFetchers } = await setupTest()

        expect(
            await generateTemplateDocs({
                templateAnalysis: analyzeTemplate({ code: '{{{PageTitle}}}' }),
                normalizedPageUrls: [DATA.testPageA.url],
                annotationUrls: [DATA.testAnnotationAUrl],
                dataFetchers,
            }),
        ).toEqual([
            {
                PageTitle: DATA.testPageA.fullTitle,
                PageUrl: DATA.testPageAUrl,
                title: DATA.testPageA.fullTitle,
                url: DATA.testPageAUrl,
            },
        ])

        expect(
            await generateTemplateDocs({
                templateAnalysis: analyzeTemplate({
                    code: '{{{PageTitle}}} {{{PageSpaces}}}',
                }),
                normalizedPageUrls: [DATA.testPageA.url],
                annotationUrls: [DATA.testAnnotationAUrl],
                dataFetchers,
            }),
        ).toEqual([
            {
                PageTitle: DATA.testPageA.fullTitle,
                PageSpaces: joinSpaces(DATA.testPageASpaces),
                PageSpaceList: DATA.testPageASpaces,
                PageUrl: DATA.testPageAUrl,
                title: DATA.testPageA.fullTitle,
                url: DATA.testPageAUrl,
            },
        ])
        expect(
            await generateTemplateDocs({
                templateAnalysis: analyzeTemplate({
                    code: '{{{PageTitle}}} {{{PageTags}}} {{{PageSpaces}}}',
                }),
                normalizedPageUrls: [DATA.testPageA.url],
                annotationUrls: [DATA.testAnnotationAUrl],
                dataFetchers,
            }),
        ).toEqual([
            {
                PageTitle: DATA.testPageA.fullTitle,
                PageTags: joinTags(DATA.testPageATags),
                PageTagList: DATA.testPageATags,
                PageSpaces: joinSpaces(DATA.testPageASpaces),
                PageSpaceList: DATA.testPageASpaces,
                PageUrl: DATA.testPageAUrl,
                title: DATA.testPageA.fullTitle,
                tags: DATA.testPageATags,
                url: DATA.testPageAUrl,
            },
        ])

        expect(
            await generateTemplateDocs({
                templateAnalysis: analyzeTemplate({
                    code: '{{{PageTitle}}} {{{PageTags}}} {{{PageLink}}}',
                }),
                normalizedPageUrls: [DATA.testPageA.url],
                annotationUrls: [DATA.testAnnotationAUrl],
                dataFetchers,
            }),
        ).toEqual([
            {
                PageTitle: DATA.testPageA.fullTitle,
                PageTags: joinTags(DATA.testPageATags),
                PageTagList: DATA.testPageATags,
                PageUrl: DATA.testPageAUrl,
                PageLink: expect.any(String), // TODO: properly set once implemented
                title: DATA.testPageA.fullTitle,
                tags: DATA.testPageATags,
                url: DATA.testPageAUrl,
            },
        ])
    })

    it('should correctly generate template docs for single annotation', async () => {
        const { dataFetchers } = await setupTest()

        const generate = (template: string) =>
            generateTemplateDocs({
                templateAnalysis: analyzeTemplate({ code: template }),
                normalizedPageUrls: [DATA.testPageA.url],
                annotationUrls: [DATA.testAnnotationAUrl],
                dataFetchers,
            })

        expect(await generate('{{{NoteText}}}')).toEqual([
            {
                NoteText: DATA.testAnnotationAText,
            },
        ])

        expect(await generate('{{{NoteText}}} {{{PageTitle}}}')).toEqual([
            {
                PageTitle: DATA.testPageA.fullTitle,
                PageUrl: DATA.testPageAUrl,
                title: DATA.testPageA.fullTitle,
                url: DATA.testPageAUrl,
                NoteText: DATA.testAnnotationAText,
            },
        ])

        expect(
            await generate(
                '{{{NoteText}}} {{{NoteTags}}} {{NoteSpaces}} {{{PageTitle}}}',
            ),
        ).toEqual([
            {
                PageTitle: DATA.testPageA.fullTitle,
                PageUrl: DATA.testPageAUrl,
                NoteText: DATA.testAnnotationAText,
                NoteTags: joinTags(DATA.testAnnotationATags),
                NoteTagList: DATA.testAnnotationATags,
                NoteSpaces: joinSpaces(DATA.testAnnotationASpaces),
                NoteSpaceList: DATA.testAnnotationASpaces,
                title: DATA.testPageA.fullTitle,
                url: DATA.testPageAUrl,
            },
        ])

        expect(
            await generate('{{{NoteText}}} {{{PageTitle}}} {{{PageTags}}}'),
        ).toEqual([
            {
                PageTitle: DATA.testPageA.fullTitle,
                PageUrl: DATA.testPageAUrl,
                PageTags: joinTags(DATA.testPageATags),
                PageTagList: DATA.testPageATags,
                NoteText: DATA.testAnnotationAText,
                title: DATA.testPageA.fullTitle,
                url: DATA.testPageAUrl,
                tags: DATA.testPageATags,
            },
        ])

        expect(
            await generate(
                '{{{NoteText}}} {{{NoteTags}}} {{{PageTitle}}} {{{PageTags}}}',
            ),
        ).toEqual([
            {
                PageTitle: DATA.testPageA.fullTitle,
                PageUrl: DATA.testPageAUrl,
                PageTags: joinTags(DATA.testPageATags),
                PageTagList: DATA.testPageATags,
                NoteText: DATA.testAnnotationAText,
                NoteTags: joinTags(DATA.testAnnotationATags),
                NoteTagList: DATA.testAnnotationATags,
                title: DATA.testPageA.fullTitle,
                url: DATA.testPageAUrl,
                tags: DATA.testPageATags,
            },
        ])

        expect(
            await generate(
                '{{{NoteText}}} {{{NoteTags}}} {{{NoteSpaces}}} {{{PageTitle}}} {{{PageTags}}} {{{PageSpaces}}}',
            ),
        ).toEqual([
            {
                PageTitle: DATA.testPageA.fullTitle,
                PageUrl: DATA.testPageAUrl,
                PageTags: joinTags(DATA.testPageATags),
                PageTagList: DATA.testPageATags,
                PageSpaces: joinSpaces(DATA.testPageASpaces),
                PageSpaceList: DATA.testPageASpaces,
                NoteText: DATA.testAnnotationAText,
                NoteTags: joinTags(DATA.testAnnotationATags),
                NoteTagList: DATA.testAnnotationATags,
                NoteSpaces: joinSpaces(DATA.testAnnotationASpaces),
                NoteSpaceList: DATA.testAnnotationASpaces,
                title: DATA.testPageA.fullTitle,
                url: DATA.testPageAUrl,
                tags: DATA.testPageATags,
            },
        ])
    })

    it('should correctly generate template docs for single annotation, with a note link', async () => {
        const { dataFetchers } = await setupTest()

        const templateDocs = await generateTemplateDocs({
            templateAnalysis: analyzeTemplate({
                code: '{{{NoteText}}} {{{NoteLink}}}',
            }),
            normalizedPageUrls: [DATA.testPageA.url],
            annotationUrls: [DATA.testAnnotationAUrl],
            dataFetchers,
        })
        expect(templateDocs).toEqual([
            {
                NoteText: DATA.testAnnotationAText,
                NoteLink: expect.any(String), // TODO: properly set once implemented
            },
        ])
        expect(isShareUrl(templateDocs[0].NoteLink)).toBe(true)
    })

    it('should correctly generate template docs for single annotation, but iterating through the notes array', async () => {
        const { dataFetchers } = await setupTest()

        expect(
            await generateTemplateDocs({
                templateAnalysis: analyzeTemplate({
                    code: '{{#Notes}}{{{NoteText}}}{{/Notes}}',
                }),
                normalizedPageUrls: [DATA.testPageA.url],
                annotationUrls: [DATA.testAnnotationAUrl],
                dataFetchers,
            }),
        ).toEqual([
            {
                Notes: [
                    {
                        NoteText: DATA.testAnnotationAText,
                    },
                ],
            },
        ])

        // This annot doesn't have any comment, only a highlight
        expect(
            await generateTemplateDocs({
                templateAnalysis: analyzeTemplate({
                    code: '{{#Notes}}{{{NoteHighlight}}}{{/Notes}}',
                }),
                normalizedPageUrls: [DATA.testPageA.url],
                annotationUrls: [DATA.testAnnotationBUrl],
                dataFetchers,
            }),
        ).toEqual([
            {
                Notes: [
                    {
                        NoteHighlight: DATA.testAnnotationBHighlight,
                    },
                ],
            },
        ])

        expect(
            await generateTemplateDocs({
                templateAnalysis: analyzeTemplate({
                    code:
                        '{{#Notes}}{{{NoteText}}} {{{NoteTags}}} {{{NoteSpaces}}}{{/Notes}}',
                }),
                normalizedPageUrls: [DATA.testPageA.url],
                annotationUrls: [DATA.testAnnotationAUrl],
                dataFetchers,
            }),
        ).toEqual([
            {
                Notes: [
                    {
                        NoteText: DATA.testAnnotationAText,
                        NoteTags: joinTags(DATA.testAnnotationATags),
                        NoteTagList: DATA.testAnnotationATags,
                        NoteSpaces: joinSpaces(DATA.testAnnotationASpaces),
                        NoteSpaceList: DATA.testAnnotationASpaces,
                    },
                ],
            },
        ])
    })

    it('should correctly generate template docs for multiple annotations, but only with page references', async () => {
        const { dataFetchers } = await setupTest()

        expect(
            await generateTemplateDocs({
                templateAnalysis: analyzeTemplate({ code: '{{{PageTitle}}}' }),
                normalizedPageUrls: [DATA.testPageA.url],
                annotationUrls: [
                    DATA.testAnnotationAUrl,
                    DATA.testAnnotationBUrl,
                ],
                dataFetchers,
            }),
        ).toEqual([
            {
                PageTitle: DATA.testPageA.fullTitle,
                PageUrl: DATA.testPageAUrl,

                title: DATA.testPageA.fullTitle,
                url: DATA.testPageAUrl,
            },
        ])

        expect(
            await generateTemplateDocs({
                templateAnalysis: analyzeTemplate({
                    code: '{{{PageTitle}}} {{{PageTags}}}',
                }),
                normalizedPageUrls: [DATA.testPageA.url],
                annotationUrls: [
                    DATA.testAnnotationAUrl,
                    DATA.testAnnotationBUrl,
                ],
                dataFetchers,
            }),
        ).toEqual([
            {
                PageTitle: DATA.testPageA.fullTitle,
                PageTags: joinTags(DATA.testPageATags),
                PageTagList: DATA.testPageATags,
                PageUrl: DATA.testPageAUrl,

                title: DATA.testPageA.fullTitle,
                tags: DATA.testPageATags,
                url: DATA.testPageAUrl,
            },
        ])

        expect(
            await generateTemplateDocs({
                templateAnalysis: analyzeTemplate({
                    code: '{{{PageTitle}}} {{{PageSpaces}}}',
                }),
                normalizedPageUrls: [DATA.testPageA.url],
                annotationUrls: [
                    DATA.testAnnotationAUrl,
                    DATA.testAnnotationBUrl,
                ],
                dataFetchers,
            }),
        ).toEqual([
            {
                PageTitle: DATA.testPageA.fullTitle,
                PageSpaces: joinSpaces(DATA.testPageASpaces),
                PageSpaceList: DATA.testPageASpaces,
                PageUrl: DATA.testPageAUrl,

                title: DATA.testPageA.fullTitle,
                url: DATA.testPageAUrl,
            },
        ])

        expect(
            await generateTemplateDocs({
                templateAnalysis: analyzeTemplate({
                    code: '{{{PageTitle}}} {{{PageTags}}} {{{PageLink}}}',
                }),
                normalizedPageUrls: [DATA.testPageA.url],
                annotationUrls: [
                    DATA.testAnnotationAUrl,
                    DATA.testAnnotationBUrl,
                ],
                dataFetchers,
            }),
        ).toEqual([
            {
                PageTitle: DATA.testPageA.fullTitle,
                PageTags: joinTags(DATA.testPageATags),
                PageTagList: DATA.testPageATags,
                PageUrl: DATA.testPageAUrl,
                PageLink: expect.any(String), // TODO: properly set once implemented

                title: DATA.testPageA.fullTitle,
                tags: DATA.testPageATags,
                url: DATA.testPageAUrl,
            },
        ])
    })

    it('should correctly generate template docs for multiple annotations, but only referencing top-level annotation vars', async () => {
        const { dataFetchers } = await setupTest()

        const generate = (template: string) =>
            generateTemplateDocs({
                templateAnalysis: analyzeTemplate({ code: template }),
                normalizedPageUrls: [DATA.testPageA.url],
                annotationUrls: [
                    DATA.testAnnotationAUrl,
                    DATA.testAnnotationBUrl,
                ],
                dataFetchers,
            })

        expect(await generate('{{{NoteText}}} {{{NoteTags}}}')).toEqual([
            {
                NoteText: DATA.testAnnotationAText,
                NoteTags: joinTags(DATA.testAnnotationATags),
                NoteTagList: DATA.testAnnotationATags,
            },
            {
                NoteHighlight: DATA.testAnnotationBHighlight,
                NoteTags: joinTags(DATA.testAnnotationBTags),
                NoteTagList: DATA.testAnnotationBTags,
            },
        ])

        expect(await generate('{{{NoteText}}} {{{NoteSpaces}}}')).toEqual([
            {
                NoteText: DATA.testAnnotationAText,
                NoteSpaces: joinSpaces(DATA.testAnnotationASpaces),
                NoteSpaceList: DATA.testAnnotationASpaces,
            },
            {
                NoteHighlight: DATA.testAnnotationBHighlight,
                NoteSpaces: joinSpaces(DATA.testAnnotationBSpaces),
                NoteSpaceList: DATA.testAnnotationBSpaces,
            },
        ])

        expect(await generate('{{{NoteText}}}')).toEqual([
            {
                NoteText: DATA.testAnnotationAText,
            },
            {
                NoteHighlight: DATA.testAnnotationBHighlight,
            },
        ])

        expect(await generate('{{{NoteText}}} {{{PageTitle}}}')).toEqual([
            {
                NoteText: DATA.testAnnotationAText,
                PageTitle: DATA.testPageA.fullTitle,
                PageUrl: DATA.testPageAUrl,

                title: DATA.testPageA.fullTitle,
                url: DATA.testPageAUrl,
            },
            {
                NoteHighlight: DATA.testAnnotationBHighlight,
                PageTitle: DATA.testPageA.fullTitle,
                PageUrl: DATA.testPageAUrl,

                title: DATA.testPageA.fullTitle,
                url: DATA.testPageAUrl,
            },
        ])

        expect(
            await generate(
                '{{{NoteText}}} {{{PageTitle}}} {{{PageTags}}} {{{PageSpaces}}}',
            ),
        ).toEqual([
            {
                NoteText: DATA.testAnnotationAText,
                PageTitle: DATA.testPageA.fullTitle,
                PageTags: joinTags(DATA.testPageATags),
                PageTagList: DATA.testPageATags,
                PageSpaces: joinSpaces(DATA.testPageASpaces),
                PageSpaceList: DATA.testPageASpaces,
                PageUrl: DATA.testPageAUrl,

                title: DATA.testPageA.fullTitle,
                tags: DATA.testPageATags,
                url: DATA.testPageAUrl,
            },
            {
                NoteHighlight: DATA.testAnnotationBHighlight,
                PageTitle: DATA.testPageA.fullTitle,
                PageTags: joinTags(DATA.testPageATags),
                PageTagList: DATA.testPageATags,
                PageSpaces: joinSpaces(DATA.testPageASpaces),
                PageSpaceList: DATA.testPageASpaces,
                PageUrl: DATA.testPageAUrl,

                title: DATA.testPageA.fullTitle,
                tags: DATA.testPageATags,
                url: DATA.testPageAUrl,
            },
        ])
    })

    it('should correctly generate template docs for multiple annotations', async () => {
        const { dataFetchers } = await setupTest()

        const generate = (template: string) =>
            generateTemplateDocs({
                templateAnalysis: analyzeTemplate({ code: template }),
                normalizedPageUrls: [DATA.testPageA.url],
                annotationUrls: [
                    DATA.testAnnotationAUrl,
                    DATA.testAnnotationBUrl,
                ],
                dataFetchers,
            })

        expect(await generate('{{#Notes}}{{{NoteText}}}{{/Notes}}')).toEqual([
            {
                Notes: [
                    {
                        NoteText: DATA.testAnnotationAText,
                    },
                    {
                        NoteHighlight: DATA.testAnnotationBHighlight,
                    },
                ],
            },
        ])

        expect(
            await generate('{{#Notes}}{{{NoteText}}} {{{NoteTags}}}{{/Notes}}'),
        ).toEqual([
            {
                Notes: [
                    {
                        NoteText: DATA.testAnnotationAText,
                        NoteTags: joinTags(DATA.testAnnotationATags),
                        NoteTagList: DATA.testAnnotationATags,
                    },
                    {
                        NoteHighlight: DATA.testAnnotationBHighlight,
                        NoteTags: joinTags(DATA.testAnnotationBTags),
                        NoteTagList: DATA.testAnnotationBTags,
                    },
                ],
            },
        ])

        expect(
            await generate(
                '{{#Notes}}{{{NoteText}}} {{{NoteSpaces}}}{{/Notes}}',
            ),
        ).toEqual([
            {
                Notes: [
                    {
                        NoteText: DATA.testAnnotationAText,
                        NoteSpaces: joinSpaces(DATA.testAnnotationASpaces),
                        NoteSpaceList: DATA.testAnnotationASpaces,
                    },
                    {
                        NoteHighlight: DATA.testAnnotationBHighlight,
                        NoteSpaces: joinSpaces(DATA.testAnnotationBSpaces),
                        NoteSpaceList: DATA.testAnnotationBSpaces,
                    },
                ],
            },
        ])

        expect(
            await generate(
                '{{#Notes}}{{{NoteText}}} {{{NoteTags}}}{{/Notes}} {{{PageTitle}}}',
            ),
        ).toEqual([
            {
                PageUrl: DATA.testPageAUrl,
                PageTitle: DATA.testPageA.fullTitle,
                url: DATA.testPageAUrl,
                title: DATA.testPageA.fullTitle,
                Notes: [
                    {
                        NoteText: DATA.testAnnotationAText,
                        NoteTags: joinTags(DATA.testAnnotationATags),
                        NoteTagList: DATA.testAnnotationATags,
                        PageUrl: DATA.testPageAUrl,
                        PageTitle: DATA.testPageA.fullTitle,
                        url: DATA.testPageAUrl,
                        title: DATA.testPageA.fullTitle,
                    },
                    {
                        NoteHighlight: DATA.testAnnotationBHighlight,
                        NoteTags: joinTags(DATA.testAnnotationBTags),
                        NoteTagList: DATA.testAnnotationBTags,
                        PageUrl: DATA.testPageAUrl,
                        PageTitle: DATA.testPageA.fullTitle,
                        url: DATA.testPageAUrl,
                        title: DATA.testPageA.fullTitle,
                    },
                ],
            },
        ])

        expect(
            await generate(
                '{{#Notes}}{{{NoteText}}} {{{NoteTags}}} {{{NoteSpaces}}}{{/Notes}} {{{PageTitle}}} {{{PageTags}}} {{{PageSpaces}}}',
            ),
        ).toEqual([
            {
                PageUrl: DATA.testPageAUrl,
                PageTitle: DATA.testPageA.fullTitle,
                PageTags: joinTags(DATA.testPageATags),
                PageTagList: DATA.testPageATags,
                PageSpaces: joinSpaces(DATA.testPageASpaces),
                PageSpaceList: DATA.testPageASpaces,
                url: DATA.testPageAUrl,
                tags: DATA.testPageATags,
                title: DATA.testPageA.fullTitle,
                Notes: [
                    {
                        NoteText: DATA.testAnnotationAText,
                        NoteTags: joinTags(DATA.testAnnotationATags),
                        NoteTagList: DATA.testAnnotationATags,
                        NoteSpaces: joinSpaces(DATA.testAnnotationASpaces),
                        NoteSpaceList: DATA.testAnnotationASpaces,
                        PageUrl: DATA.testPageAUrl,
                        PageTitle: DATA.testPageA.fullTitle,
                        PageTags: joinTags(DATA.testPageATags),
                        PageTagList: DATA.testPageATags,
                        PageSpaces: joinSpaces(DATA.testPageASpaces),
                        PageSpaceList: DATA.testPageASpaces,
                        url: DATA.testPageAUrl,
                        tags: DATA.testPageATags,
                        title: DATA.testPageA.fullTitle,
                    },
                    {
                        NoteHighlight: DATA.testAnnotationBHighlight,
                        NoteTags: joinTags(DATA.testAnnotationBTags),
                        NoteTagList: DATA.testAnnotationBTags,
                        NoteSpaces: joinSpaces(DATA.testAnnotationBSpaces),
                        NoteSpaceList: DATA.testAnnotationBSpaces,
                        PageUrl: DATA.testPageAUrl,
                        PageTitle: DATA.testPageA.fullTitle,
                        PageTags: joinTags(DATA.testPageATags),
                        PageTagList: DATA.testPageATags,
                        PageSpaces: joinSpaces(DATA.testPageASpaces),
                        PageSpaceList: DATA.testPageASpaces,
                        url: DATA.testPageAUrl,
                        tags: DATA.testPageATags,
                        title: DATA.testPageA.fullTitle,
                    },
                ],
            },
        ])
    })

    it('should correctly generate template docs for multiple annotations, with links', async () => {
        const { dataFetchers } = await setupTest()

        const generate = (template: string) =>
            generateTemplateDocs({
                templateAnalysis: analyzeTemplate({ code: template }),
                normalizedPageUrls: [DATA.testPageA.url],
                annotationUrls: [
                    DATA.testAnnotationAUrl,
                    DATA.testAnnotationBUrl,
                ],
                dataFetchers,
            })

        expect(
            await generate('{{#Notes}}{{{NoteText}}} {{{NoteLink}}}{{/Notes}}'),
        ).toEqual([
            {
                Notes: [
                    {
                        NoteText: DATA.testAnnotationAText,
                        NoteLink: expect.any(String), // TODO: properly set once implemented
                    },
                    {
                        NoteHighlight: DATA.testAnnotationBHighlight,
                        NoteLink: expect.any(String), // TODO: properly set once implemented
                    },
                ],
            },
        ])

        expect(await generate('{{{PageLink}}} {{{PageTitle}}}')).toEqual([
            {
                PageUrl: DATA.testPageAUrl,
                PageTitle: DATA.testPageA.fullTitle,
                PageLink: expect.any(String), // TODO: properly set once implemented
                url: DATA.testPageAUrl,
                title: DATA.testPageA.fullTitle,
            },
        ])

        expect(
            await generate(
                '{{#Notes}}{{{NoteText}}} {{{NoteLink}}}{{/Notes}} {{{PageLink}}} {{{PageTitle}}}',
            ),
        ).toEqual([
            {
                PageUrl: DATA.testPageAUrl,
                PageTitle: DATA.testPageA.fullTitle,
                PageLink: expect.any(String), // TODO: properly set once implemented
                url: DATA.testPageAUrl,
                title: DATA.testPageA.fullTitle,
                Notes: [
                    {
                        NoteText: DATA.testAnnotationAText,
                        NoteLink: expect.any(String), // TODO: properly set once implemented
                        PageUrl: DATA.testPageAUrl,
                        PageTitle: DATA.testPageA.fullTitle,
                        PageLink: expect.any(String), // TODO: properly set once implemented
                        url: DATA.testPageAUrl,
                        title: DATA.testPageA.fullTitle,
                    },
                    {
                        NoteHighlight: DATA.testAnnotationBHighlight,
                        NoteLink: expect.any(String), // TODO: properly set once implemented
                        PageUrl: DATA.testPageAUrl,
                        PageTitle: DATA.testPageA.fullTitle,
                        PageLink: expect.any(String), // TODO: properly set once implemented
                        url: DATA.testPageAUrl,
                        title: DATA.testPageA.fullTitle,
                    },
                ],
            },
        ])

        expect(
            await generate(
                '{{#Notes}}{{{NoteText}}} {{{NoteLink}}} {{{NoteTags}}} {{{NoteSpaces}}}{{/Notes}} {{{PageLink}}} {{{PageTitle}}}',
            ),
        ).toEqual([
            {
                PageUrl: DATA.testPageAUrl,
                PageTitle: DATA.testPageA.fullTitle,
                PageLink: expect.any(String), // TODO: properly set once implemented
                url: DATA.testPageAUrl,
                title: DATA.testPageA.fullTitle,
                Notes: [
                    {
                        NoteText: DATA.testAnnotationAText,
                        NoteLink: expect.any(String), // TODO: properly set once implemented
                        NoteTags: joinTags(DATA.testAnnotationATags),
                        NoteTagList: DATA.testAnnotationATags,
                        NoteSpaces: joinSpaces(DATA.testAnnotationASpaces),
                        NoteSpaceList: DATA.testAnnotationASpaces,
                        PageUrl: DATA.testPageAUrl,
                        PageTitle: DATA.testPageA.fullTitle,
                        PageLink: expect.any(String), // TODO: properly set once implemented
                        url: DATA.testPageAUrl,
                        title: DATA.testPageA.fullTitle,
                    },
                    {
                        NoteHighlight: DATA.testAnnotationBHighlight,
                        NoteLink: expect.any(String), // TODO: properly set once implemented
                        NoteTags: joinTags(DATA.testAnnotationBTags),
                        NoteTagList: DATA.testAnnotationBTags,
                        NoteSpaces: joinSpaces(DATA.testAnnotationBSpaces),
                        NoteSpaceList: DATA.testAnnotationBSpaces,
                        PageUrl: DATA.testPageAUrl,
                        PageTitle: DATA.testPageA.fullTitle,
                        PageLink: expect.any(String), // TODO: properly set once implemented
                        url: DATA.testPageAUrl,
                        title: DATA.testPageA.fullTitle,
                    },
                ],
            },
        ])
    })
})
