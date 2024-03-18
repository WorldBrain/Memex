import Storex from '@worldbrain/storex'
import { normalizeUrl } from '@worldbrain/memex-common/lib/url-utils/normalize'

import { setupBackgroundIntegrationTest } from 'src/tests/background-integration-tests'
import generateTemplateDocs, {
    joinTags,
    joinSpaces,
    serializeDate,
} from './template-doc-generation'
import { abbreviateName, analyzeTemplate } from './utils'
import * as DATA from './template-doc-generation.test.data'
import { getTemplateDataFetchers } from './background/template-data-fetchers'
import { TEST_USER } from '@worldbrain/memex-common/lib/authentication/dev'
import { createPageLinkListTitle, isShareUrl } from 'src/content-sharing/utils'
import { AnnotationPrivacyLevels } from '@worldbrain/memex-common/lib/annotations/types'

async function insertTestData(storageManager: Storex) {
    await storageManager.collection('pages').createObject(DATA.testPageA)
    await storageManager.collection('visits').createObject({
        url: DATA.testPageA.url,
        time: DATA.testPageACreatedAt.getTime(),
    })

    await storageManager.collection('pages').createObject(DATA.testPageB)
    await storageManager
        .collection('pageMetadata')
        .createObject(DATA.testPageBMetadata)
    await storageManager
        .collection('pageEntities')
        .createObject(DATA.testPageBEntityA)
    await storageManager
        .collection('pageEntities')
        .createObject(DATA.testPageBEntityB)
    await storageManager.collection('bookmarks').createObject({
        url: DATA.testPageB.url,
        time: DATA.testPageBCreatedAt.getTime(),
    })

    await storageManager.collection('pages').createObject(DATA.testPageC)
    await storageManager.collection('visits').createObject({
        url: DATA.testPageC.url,
        time: DATA.testPageCCreatedAt.getTime(),
    })
    await storageManager.collection('bookmarks').createObject({
        url: DATA.testPageC.url,
        time: DATA.testPageCCreatedAt.getTime() + 1000,
    })
    await storageManager
        .collection('pageMetadata')
        .createObject(DATA.testPageCMetadata)
    await storageManager
        .collection('pageEntities')
        .createObject(DATA.testPageCEntityA)

    const publicSpaceNames = new Set<string>([
        ...[...DATA.testPageASpaces, ...DATA.testPageAPrivateSpaces],
        ...DATA.testPageBSpaces,
        ...DATA.testPageCSpaces,
        ...DATA.testAnnotationASpaces,
        ...DATA.testAnnotationBSpaces,
        ...DATA.testAnnotationCSpaces,
        ...DATA.testAnnotationDSpaces,
    ])
    const privateSpaceNames = new Set<string>([...DATA.testPageAPrivateSpaces])

    const spaceNamesToIds = new Map<string, number>()
    let listIdCounter = 0
    for (const name of publicSpaceNames) {
        await storageManager.collection('customLists').createObject({
            name,
            id: listIdCounter,
            createdAt: new Date(listIdCounter),
        })
        await storageManager.collection('sharedListMetadata').createObject({
            localId: listIdCounter,
            remoteId: listIdCounter.toString(),
        })
        spaceNamesToIds.set(name, listIdCounter)
        listIdCounter++
    }

    for (const name of privateSpaceNames) {
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
        createdWhen: DATA.testAnnotationACreatedAt,
    })
    await storageManager.collection('annotationPrivacyLevels').createObject({
        id: 1,
        createdWhen: new Date(),
        annotation: DATA.testAnnotationAUrl,
        privacyLevel: AnnotationPrivacyLevels.SHARED,
    })
    await storageManager.collection('annotations').createObject({
        url: DATA.testAnnotationBUrl,
        body: DATA.testAnnotationBHighlight,
        pageUrl: DATA.testPageA.url,
        createdWhen: DATA.testAnnotationBCreatedAt,
    })
    await storageManager.collection('annotationPrivacyLevels').createObject({
        id: 2,
        createdWhen: new Date(),
        annotation: DATA.testAnnotationBUrl,
        privacyLevel: AnnotationPrivacyLevels.PROTECTED,
    })
    await storageManager.collection('annotations').createObject({
        url: DATA.testAnnotationCUrl,
        body: DATA.testAnnotationCHighlight,
        pageUrl: DATA.testPageB.url,
        createdWhen: DATA.testAnnotationCCreatedAt,
    })
    await storageManager.collection('annotationPrivacyLevels').createObject({
        id: 3,
        createdWhen: new Date(),
        annotation: DATA.testAnnotationCUrl,
        privacyLevel: AnnotationPrivacyLevels.PROTECTED,
    })
    await storageManager.collection('annotations').createObject({
        url: DATA.testAnnotationDUrl,
        body: DATA.testAnnotationDHighlight,
        pageUrl: DATA.testPageC.url,
        createdWhen: DATA.testAnnotationDCreatedAt,
    })
    await storageManager.collection('annotationPrivacyLevels').createObject({
        id: 4,
        createdWhen: new Date(),
        annotation: DATA.testAnnotationDUrl,
        privacyLevel: AnnotationPrivacyLevels.PROTECTED,
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

    await insertPageEntries(DATA.testPageAUrl, [
        ...DATA.testPageASpaces,
        ...DATA.testPageAPrivateSpaces,
    ])
    await insertPageEntries(DATA.testPageBUrl, DATA.testPageBSpaces)
    await insertPageEntries(DATA.testPageCUrl, DATA.testPageCSpaces)

    // NOTE: this annot is public, thus doesn't contain explicit entries for shared spaces, instead inhereting them from parent
    await insertAnnotEntries(
        DATA.testAnnotationAUrl,
        DATA.testAnnotationASpaces.filter(
            (name) =>
                ![
                    ...DATA.testPageASpaces,
                    ...DATA.testPageAPrivateSpaces,
                ].includes(name),
        ),
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
            imageSupport: backgroundModules.imageSupport,
        }),
    }
}

describe('Content template doc generation', () => {
    it('should correctly generate template xxx docs for a single PDF page + notes + page tags + note tags + page spaces + note spaces + metadata + entities', async () => {
        const { dataFetchers } = await setupTest()

        expect(
            await generateTemplateDocs({
                templateAnalysis: analyzeTemplate({
                    code:
                        '{{{PageTitle}}} {{{PageUrl}}} {{{PageTags}}} {{{PageSpaces}}} {{{PageDOI}}} {{{PageMetaTitle}}} {{{PageAnnotation}}} {{{PageSourceName}}} {{{PageJournalName}}} {{{PageJournalPage}}} {{{PageJournalIssue}}} {{{PageJournalVolume}}} {{{PageReleaseDate}}} {{{PageAccessDate}}} {{#PageEntities}} {{EntityName}} {{/PageEntities}}',
                }),
                normalizedPageUrls: [DATA.testPageC.url],
                annotationUrls: [],
                dataFetchers,
            }),
        ).toEqual([
            {
                HasNotes: false,
                PageTitle: DATA.testPageC.fullTitle,
                PageUrl: DATA.testLocatorC.originalLocation,
                PageTags: joinTags(DATA.testPageCTags),
                PageTagList: DATA.testPageCTags,
                PageSpaces: joinSpaces(DATA.testPageCSpaces),
                PageSpacesList: DATA.testPageCSpaces,

                PageDOI: DATA.testPageCMetadata.doi,
                PageMetaTitle: DATA.testPageCMetadata.title,
                PageAnnotation: DATA.testPageCMetadata.annotation,
                PageSourceName: DATA.testPageCMetadata.sourceName,
                PageJournalName: DATA.testPageCMetadata.journalName,
                PageJournalPage: DATA.testPageCMetadata.journalPage,
                PageJournalIssue: DATA.testPageCMetadata.journalIssue,
                PageJournalVolume: DATA.testPageCMetadata.journalVolume,
                PageReleaseDate: serializeDate(
                    DATA.testPageCMetadata.releaseDate,
                ),
                PageAccessDate: serializeDate(
                    DATA.testPageCMetadata.accessDate,
                ),

                PageEntities: [{ EntityName: DATA.testPageCEntityA.name }],

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
                HasNotes: true,
                Notes: [
                    {
                        NoteHighlight: DATA.testAnnotationDHighlight,
                        NoteTags: joinTags(DATA.testAnnotationDTags),
                        NoteTagList: DATA.testAnnotationDTags,
                        NoteSpaces: joinSpaces(DATA.testAnnotationDSpaces),
                        NoteSpacesList: DATA.testAnnotationDSpaces,
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
                HasNotes: false,
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
                HasNotes: false,
                PageTitle: DATA.testPageA.fullTitle,
                PageUrl: DATA.testPageAUrl,
                PageTags: joinTags(DATA.testPageATags),
                PageTagList: DATA.testPageATags,
                PageSpaces: joinSpaces([
                    ...DATA.testPageASpaces,
                    ...DATA.testPageAPrivateSpaces,
                ]),
                PageSpacesList: [
                    ...DATA.testPageASpaces,
                    ...DATA.testPageAPrivateSpaces,
                ],
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
                HasNotes: false,
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
                HasNotes: false,
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

        expect(
            await generateTemplateDocs({
                templateAnalysis: analyzeTemplate({
                    code:
                        '{{{PageTitle}}} {{{PageLink}}} {{{PageTags}}} {{{PageCreatedAt}}}',
                }),
                normalizedPageUrls: [DATA.testPageA.url],
                annotationUrls: [],
                dataFetchers,
            }),
        ).toEqual([
            {
                HasNotes: false,
                PageLink: expect.any(String), // TODO: properly set once implemented
                PageTitle: DATA.testPageA.fullTitle,
                PageUrl: DATA.testPageAUrl,
                PageTags: joinTags(DATA.testPageATags),
                PageTagList: DATA.testPageATags,
                PageCreatedAt: serializeDate(DATA.testPageACreatedAt),
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
                '{{{PageTitle}}} {{#Notes}}{{{NoteText}}} {{{NoteCreatedAt}}}{{/Notes}}',
            ),
        ).toEqual([
            {
                PageTitle: DATA.testPageA.fullTitle,
                PageUrl: DATA.testPageAUrl,
                title: DATA.testPageA.fullTitle,
                url: DATA.testPageAUrl,
                HasNotes: true,
                Notes: [
                    {
                        NoteText: DATA.testAnnotationAText,
                        NoteCreatedAt: serializeDate(
                            DATA.testAnnotationACreatedAt,
                        ),
                    },
                    {
                        NoteHighlight: DATA.testAnnotationBHighlight,
                        NoteCreatedAt: serializeDate(
                            DATA.testAnnotationBCreatedAt,
                        ),
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
                HasNotes: true,
                Notes: [
                    {
                        NoteText: DATA.testAnnotationAText,
                        NoteTags: joinTags(DATA.testAnnotationATags),
                        NoteTagList: DATA.testAnnotationATags,
                        NoteSpaces: joinSpaces(DATA.testAnnotationASpaces),
                        NoteSpacesList: DATA.testAnnotationASpaces,
                    },
                    {
                        NoteHighlight: DATA.testAnnotationBHighlight,
                        NoteTags: joinTags(DATA.testAnnotationBTags),
                        NoteTagList: DATA.testAnnotationBTags,
                        NoteSpaces: joinSpaces(DATA.testAnnotationBSpaces),
                        NoteSpacesList: DATA.testAnnotationBSpaces,
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
                HasNotes: true,
                Notes: [
                    {
                        NoteText: DATA.testAnnotationAText,
                        NoteLink: expect.any(String), // TODO: properly set once implemented
                    },
                    {
                        NoteHighlight: DATA.testAnnotationBHighlight,
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
                HasNotes: true,
                Notes: [
                    {
                        NoteText: DATA.testAnnotationAText,
                        NoteLink: expect.any(String), // TODO: properly set once implemented
                    },
                    {
                        NoteHighlight: DATA.testAnnotationBHighlight,
                    },
                ],
            },
        ])

        expect(
            await generate(
                '{{{PageTitle}}} {{{PageTags}}} {{PageSpaces}} {{PageCreatedAt}} {{{PageLink}}} {{#Notes}}{{{NoteText}}} {{{NoteLink}}} {{{NoteCreatedAt}}}{{/Notes}}',
            ),
        ).toEqual([
            {
                PageTitle: DATA.testPageA.fullTitle,
                PageUrl: DATA.testPageAUrl,
                PageTags: joinTags(DATA.testPageATags),
                PageTagList: DATA.testPageATags,
                PageSpaces: joinSpaces([
                    ...DATA.testPageASpaces,
                    ...DATA.testPageAPrivateSpaces,
                ]),
                PageSpacesList: [
                    ...DATA.testPageASpaces,
                    ...DATA.testPageAPrivateSpaces,
                ],
                PageLink: expect.any(String), // TODO: properly set once implemented
                PageCreatedAt: serializeDate(DATA.testPageACreatedAt),
                title: DATA.testPageA.fullTitle,
                url: DATA.testPageAUrl,
                tags: DATA.testPageATags,
                HasNotes: true,
                Notes: [
                    {
                        NoteText: DATA.testAnnotationAText,
                        NoteLink: expect.any(String), // TODO: properly set once implemented
                        NoteCreatedAt: serializeDate(
                            DATA.testAnnotationACreatedAt,
                        ),
                    },
                    {
                        NoteHighlight: DATA.testAnnotationBHighlight,
                        NoteCreatedAt: serializeDate(
                            DATA.testAnnotationBCreatedAt,
                        ),
                    },
                ],
            },
        ])
    })

    it('should correctly generate template docs for multiple pages', async () => {
        const { dataFetchers } = await setupTest()

        const currentDate = new Date()
        const generate = (template: string) =>
            generateTemplateDocs({
                templateAnalysis: analyzeTemplate({ code: template }),
                normalizedPageUrls: [DATA.testPageA.url, DATA.testPageB.url],
                annotationUrls: [],
                dataFetchers,
                now: currentDate.valueOf(),
            })

        expect(await generate('{{#Pages}}{{{PageTitle}}}{{/Pages}}')).toEqual([
            {
                Pages: [
                    {
                        HasNotes: false,
                        Notes: [],
                        PageEntities: [],
                        PageTitle: DATA.testPageA.fullTitle,
                        PageUrl: DATA.testPageAUrl,
                        title: DATA.testPageA.fullTitle,
                        url: DATA.testPageAUrl,
                    },
                    {
                        HasNotes: false,
                        Notes: [],
                        PageEntities: [],
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
                        HasNotes: false,
                        Notes: [],
                        PageEntities: [],
                        PageTitle: DATA.testPageA.fullTitle,
                        PageUrl: DATA.testPageAUrl,
                        PageLink: expect.any(String),
                        title: DATA.testPageA.fullTitle,
                        url: DATA.testPageAUrl,
                    },
                    {
                        HasNotes: false,
                        Notes: [],
                        PageEntities: [],
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
                        HasNotes: false,
                        Notes: [],
                        PageEntities: [],
                        PageTitle: DATA.testPageA.fullTitle,
                        PageTags: joinTags(DATA.testPageATags),
                        PageTagList: DATA.testPageATags,
                        PageUrl: DATA.testPageAUrl,
                        title: DATA.testPageA.fullTitle,
                        tags: DATA.testPageATags,
                        url: DATA.testPageAUrl,
                    },
                    {
                        HasNotes: false,
                        Notes: [],
                        PageEntities: [],
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
                        HasNotes: false,
                        Notes: [],
                        PageEntities: [],
                        PageTitle: DATA.testPageA.fullTitle,
                        PageSpaces: joinSpaces([
                            ...DATA.testPageASpaces,
                            ...DATA.testPageAPrivateSpaces,
                        ]),
                        PageSpacesList: [
                            ...DATA.testPageASpaces,
                            ...DATA.testPageAPrivateSpaces,
                        ],
                        PageUrl: DATA.testPageAUrl,
                        title: DATA.testPageA.fullTitle,
                        url: DATA.testPageAUrl,
                    },
                    {
                        HasNotes: false,
                        Notes: [],
                        PageEntities: [],
                        PageTitle: DATA.testPageB.fullTitle,
                        PageSpaces: joinSpaces(DATA.testPageBSpaces),
                        PageSpacesList: DATA.testPageBSpaces,
                        PageUrl: DATA.testPageBUrl,
                        title: DATA.testPageB.fullTitle,
                        url: DATA.testPageBUrl,
                    },
                ],
            },
        ])

        expect(
            await generate(
                '{{#Pages}} {{{PageTitle}}} {{{PageTags}}} {{{PageLink}}} {{{PageCreatedAt}}} {{/Pages}}',
            ),
        ).toEqual([
            {
                Pages: [
                    {
                        HasNotes: false,
                        Notes: [],
                        PageEntities: [],
                        PageTitle: DATA.testPageA.fullTitle,
                        PageTags: joinTags(DATA.testPageATags),
                        PageTagList: DATA.testPageATags,
                        PageUrl: DATA.testPageAUrl,
                        PageLink: expect.any(String),
                        PageCreatedAt: serializeDate(DATA.testPageACreatedAt),
                        title: DATA.testPageA.fullTitle,
                        tags: DATA.testPageATags,
                        url: DATA.testPageAUrl,
                    },
                    {
                        HasNotes: false,
                        Notes: [],
                        PageEntities: [],
                        PageTitle: DATA.testPageB.fullTitle,
                        PageTags: joinTags(DATA.testPageBTags),
                        PageTagList: DATA.testPageBTags,
                        PageUrl: DATA.testPageBUrl,
                        PageLink: expect.any(String),
                        PageCreatedAt: serializeDate(DATA.testPageBCreatedAt),
                        title: DATA.testPageB.fullTitle,
                        tags: DATA.testPageBTags,
                        url: DATA.testPageBUrl,
                    },
                ],
            },
        ])

        const pageLinkName = createPageLinkListTitle(currentDate)
        expect(
            await generate(
                '{{#Pages}} {{{PageTitle}}} {{{PageSpaces}}} {{{PageLink}}} {{/Pages}}',
            ),
        ).toEqual([
            {
                Pages: [
                    {
                        HasNotes: false,
                        Notes: [],
                        PageEntities: [],
                        PageTitle: DATA.testPageA.fullTitle,
                        PageSpaces: joinSpaces([
                            ...DATA.testPageASpaces,
                            ...DATA.testPageAPrivateSpaces,
                            pageLinkName,
                        ]),
                        PageSpacesList: [
                            ...DATA.testPageASpaces,
                            ...DATA.testPageAPrivateSpaces,
                            pageLinkName,
                        ],
                        PageUrl: DATA.testPageAUrl,
                        PageLink: expect.any(String),
                        title: DATA.testPageA.fullTitle,
                        url: DATA.testPageAUrl,
                    },
                    {
                        HasNotes: false,
                        Notes: [],
                        PageEntities: [],
                        PageTitle: DATA.testPageB.fullTitle,
                        PageSpaces: joinSpaces([
                            ...DATA.testPageBSpaces,
                            pageLinkName,
                        ]),
                        PageSpacesList: [...DATA.testPageBSpaces, pageLinkName],
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
                HasNotes: false,
                PageTitle: DATA.testPageA.fullTitle,
                PageUrl: DATA.testPageAUrl,
                title: DATA.testPageA.fullTitle,
                url: DATA.testPageAUrl,
            },
            {
                HasNotes: false,
                PageTitle: DATA.testPageB.fullTitle,
                PageUrl: DATA.testPageBUrl,
                title: DATA.testPageB.fullTitle,
                url: DATA.testPageBUrl,
            },
        ])

        expect(await generate('{{{PageTitle}}} {{{PageTags}}}')).toEqual([
            {
                HasNotes: false,
                PageTitle: DATA.testPageA.fullTitle,
                PageTags: joinTags(DATA.testPageATags),
                PageTagList: DATA.testPageATags,
                PageUrl: DATA.testPageAUrl,
                title: DATA.testPageA.fullTitle,
                tags: DATA.testPageATags,
                url: DATA.testPageAUrl,
            },
            {
                HasNotes: false,
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
                HasNotes: false,
                PageTitle: DATA.testPageA.fullTitle,
                PageSpaces: joinSpaces([
                    ...DATA.testPageASpaces,
                    ...DATA.testPageAPrivateSpaces,
                ]),
                PageSpacesList: [
                    ...DATA.testPageASpaces,
                    ...DATA.testPageAPrivateSpaces,
                ],
                PageUrl: DATA.testPageAUrl,
                title: DATA.testPageA.fullTitle,
                url: DATA.testPageAUrl,
            },
            {
                HasNotes: false,
                PageTitle: DATA.testPageB.fullTitle,
                PageSpaces: joinSpaces(DATA.testPageBSpaces),
                PageSpacesList: DATA.testPageBSpaces,
                PageUrl: DATA.testPageBUrl,
                title: DATA.testPageB.fullTitle,
                url: DATA.testPageBUrl,
            },
        ])

        expect(await generate('{{{PageTitle}}} {{{PageLink}}}')).toEqual([
            {
                HasNotes: false,
                PageTitle: DATA.testPageA.fullTitle,
                PageUrl: DATA.testPageAUrl,
                PageLink: expect.any(String),
                title: DATA.testPageA.fullTitle,
                url: DATA.testPageAUrl,
            },
            {
                HasNotes: false,
                PageTitle: DATA.testPageB.fullTitle,
                PageUrl: DATA.testPageBUrl,
                PageLink: expect.any(String),
                title: DATA.testPageB.fullTitle,
                url: DATA.testPageBUrl,
            },
        ])

        expect(
            await generate(
                '{{{PageTitle}}} {{{PageTags}}} {{{PageLink}}} {{{PageCreatedAt}}}',
            ),
        ).toEqual([
            {
                HasNotes: false,
                PageTitle: DATA.testPageA.fullTitle,
                PageTags: joinTags(DATA.testPageATags),
                PageTagList: DATA.testPageATags,
                PageUrl: DATA.testPageAUrl,
                PageLink: expect.any(String),
                PageCreatedAt: serializeDate(DATA.testPageACreatedAt),
                title: DATA.testPageA.fullTitle,
                tags: DATA.testPageATags,
                url: DATA.testPageAUrl,
            },
            {
                HasNotes: false,
                PageTitle: DATA.testPageB.fullTitle,
                PageTags: joinTags(DATA.testPageBTags),
                PageTagList: DATA.testPageBTags,
                PageUrl: DATA.testPageBUrl,
                PageLink: expect.any(String),
                PageCreatedAt: serializeDate(DATA.testPageBCreatedAt),
                title: DATA.testPageB.fullTitle,
                tags: DATA.testPageBTags,
                url: DATA.testPageBUrl,
            },
        ])
    })

    it('should correctly generate template docs xxx for multiple pages, with note references', async () => {
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
                '{{#Pages}} {{{PageTitle}}} {{{PageTags}}} {{{PageSpaces}}} {{{PageLink}}} {{{PageCreatedAt}}} {{#Notes}} {{{NoteHighlight}}} {{{NoteText}}} {{{NoteTags}}} {{{NoteSpaces}}} {{{NoteLink}}} {{{NoteCreatedAt}}} {{/Notes}} {{#PageEntities}} {{{EntityName}}} {{/PageEntities}} {{/Pages}}',
            ),
        ).toEqual([
            {
                Pages: [
                    {
                        PageTitle: DATA.testPageA.fullTitle,
                        PageTags: joinTags(DATA.testPageATags),
                        PageTagList: DATA.testPageATags,
                        PageSpaces: joinSpaces([
                            ...DATA.testPageASpaces,
                            ...DATA.testPageAPrivateSpaces,
                        ]),
                        PageSpacesList: [
                            ...DATA.testPageASpaces,
                            ...DATA.testPageAPrivateSpaces,
                        ],
                        PageUrl: DATA.testPageAUrl,
                        PageLink: expect.any(String),
                        PageCreatedAt: serializeDate(DATA.testPageACreatedAt),

                        PageEntities: [],

                        title: DATA.testPageA.fullTitle,
                        tags: DATA.testPageATags,
                        url: DATA.testPageAUrl,
                        HasNotes: true,
                        Notes: [
                            {
                                NoteText: DATA.testAnnotationAText,
                                NoteTags: joinTags(DATA.testAnnotationATags),
                                NoteTagList: DATA.testAnnotationATags,
                                NoteSpaces: joinSpaces(
                                    DATA.testAnnotationASpaces,
                                ),
                                NoteSpacesList: DATA.testAnnotationASpaces,
                                NoteLink: expect.any(String),
                                NoteCreatedAt: serializeDate(
                                    DATA.testAnnotationACreatedAt,
                                ),
                                PageTitle: DATA.testPageA.fullTitle,
                                PageTags: joinTags(DATA.testPageATags),
                                PageTagList: DATA.testPageATags,
                                PageSpaces: joinSpaces([
                                    ...DATA.testPageASpaces,
                                    ...DATA.testPageAPrivateSpaces,
                                ]),
                                PageSpacesList: [
                                    ...DATA.testPageASpaces,
                                    ...DATA.testPageAPrivateSpaces,
                                ],
                                PageUrl: DATA.testPageAUrl,
                                PageLink: expect.any(String),
                                PageCreatedAt: serializeDate(
                                    DATA.testPageACreatedAt,
                                ),
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
                                NoteSpacesList: DATA.testAnnotationBSpaces,
                                NoteCreatedAt: serializeDate(
                                    DATA.testAnnotationBCreatedAt,
                                ),
                                PageTitle: DATA.testPageA.fullTitle,
                                PageTags: joinTags(DATA.testPageATags),
                                PageTagList: DATA.testPageATags,
                                PageSpaces: joinSpaces([
                                    ...DATA.testPageASpaces,
                                    ...DATA.testPageAPrivateSpaces,
                                ]),
                                PageSpacesList: [
                                    ...DATA.testPageASpaces,
                                    ...DATA.testPageAPrivateSpaces,
                                ],
                                PageUrl: DATA.testPageAUrl,
                                PageLink: expect.any(String),
                                PageCreatedAt: serializeDate(
                                    DATA.testPageACreatedAt,
                                ),
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
                        PageSpacesList: DATA.testPageBSpaces,
                        PageUrl: DATA.testPageBUrl,
                        PageLink: expect.any(String),
                        PageCreatedAt: serializeDate(DATA.testPageBCreatedAt),

                        PageAccessDate: expect.any(Number),
                        PageAnnotation: DATA.testPageBMetadata.annotation,
                        PageSourceName: DATA.testPageBMetadata.sourceName,

                        PageEntities: [
                            { EntityName: DATA.testPageBEntityA.name },
                            {
                                EntityName: DATA.testPageBEntityB.name,
                                EntityAdditionalName:
                                    DATA.testPageBEntityB.additionalName,
                                EntityAdditionalNameShort: abbreviateName(
                                    DATA.testPageBEntityB.additionalName,
                                ),
                            },
                        ],

                        title: DATA.testPageB.fullTitle,
                        tags: DATA.testPageBTags,
                        url: DATA.testPageBUrl,
                        HasNotes: true,
                        Notes: [
                            {
                                NoteHighlight: DATA.testAnnotationCHighlight,
                                NoteTags: joinTags(DATA.testAnnotationCTags),
                                NoteTagList: DATA.testAnnotationCTags,
                                // NOTE: these should be excluded as this annot isn't a part of any spaces
                                // NoteSpaces: joinSpaces(
                                //     DATA.testAnnotationCSpaces,
                                // ),
                                // NoteSpacesList: DATA.testAnnotationCSpaces,
                                NoteCreatedAt: serializeDate(
                                    DATA.testAnnotationCCreatedAt,
                                ),
                                PageAccessDate: expect.any(Number),
                                PageAnnotation:
                                    DATA.testPageBMetadata.annotation,
                                PageSourceName:
                                    DATA.testPageBMetadata.sourceName,
                                PageTitle: DATA.testPageB.fullTitle,
                                PageTags: joinTags(DATA.testPageBTags),
                                PageTagList: DATA.testPageBTags,
                                PageSpaces: joinSpaces(DATA.testPageBSpaces),
                                PageSpacesList: DATA.testPageBSpaces,
                                PageUrl: DATA.testPageBUrl,
                                PageLink: expect.any(String),
                                PageCreatedAt: serializeDate(
                                    DATA.testPageBCreatedAt,
                                ),
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
                        PageCreatedAt: DATA.testPageACreatedAt.valueOf(),
                        PageEntities: [],
                        title: DATA.testPageA.fullTitle,
                        tags: DATA.testPageATags,
                        url: DATA.testPageAUrl,
                        HasNotes: true,
                        Notes: [
                            {
                                NoteCreatedAt: DATA.testAnnotationACreatedAt.valueOf(),
                                PageCreatedAt: DATA.testPageACreatedAt.valueOf(),
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
                                NoteCreatedAt: DATA.testAnnotationBCreatedAt.valueOf(),
                                PageCreatedAt: DATA.testPageACreatedAt.valueOf(),
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
                        PageSourceName: DATA.testPageBMetadata.sourceName,
                        PageAccessDate: DATA.testPageBMetadata.accessDate,
                        PageAnnotation: DATA.testPageBMetadata.annotation,
                        PageCreatedAt: DATA.testPageBCreatedAt.valueOf(),
                        PageEntities: [],
                        title: DATA.testPageB.fullTitle,
                        tags: DATA.testPageBTags,
                        url: DATA.testPageBUrl,
                        HasNotes: true,
                        Notes: [
                            {
                                NoteCreatedAt: DATA.testAnnotationCCreatedAt.valueOf(),
                                PageCreatedAt: DATA.testPageBCreatedAt.valueOf(),
                                PageSourceName:
                                    DATA.testPageBMetadata.sourceName,
                                PageAccessDate:
                                    DATA.testPageBMetadata.accessDate,
                                PageAnnotation:
                                    DATA.testPageBMetadata.annotation,
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
                        PageEntities: [],
                        HasNotes: true,
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
                        PageEntities: [],
                        HasNotes: true,
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
                        PageEntities: [],
                        HasNotes: true,
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
                        PageEntities: [],
                        HasNotes: true,
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
                        PageEntities: [],
                        HasNotes: true,
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
                        PageEntities: [],
                        HasNotes: true,
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

        const currentDate = new Date()
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
                now: currentDate.valueOf(),
            })

        expect(
            await generate(
                '{{{PageTitle}}} {{#Notes}} {{{NoteHighlight}}} {{/Notes}} {{PageAnnotation}} {{PageSourceName}} {{{PageDOI}}}',
            ),
        ).toEqual([
            {
                PageTitle: DATA.testPageA.fullTitle,
                PageUrl: DATA.testPageAUrl,
                title: DATA.testPageA.fullTitle,
                url: DATA.testPageAUrl,
                HasNotes: true,
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

                PageAnnotation: DATA.testPageBMetadata.annotation,
                PageSourceName: DATA.testPageBMetadata.sourceName,
                PageAccessDate: serializeDate(
                    DATA.testPageBMetadata.accessDate,
                ),

                title: DATA.testPageB.fullTitle,
                url: DATA.testPageBUrl,
                HasNotes: true,
                Notes: [
                    {
                        PageTitle: DATA.testPageB.fullTitle,
                        PageUrl: DATA.testPageBUrl,

                        PageAnnotation: DATA.testPageBMetadata.annotation,
                        PageSourceName: DATA.testPageBMetadata.sourceName,
                        PageAccessDate: serializeDate(
                            DATA.testPageBMetadata.accessDate,
                        ),

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
                HasNotes: true,
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
                HasNotes: true,
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
                HasNotes: true,
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
                HasNotes: true,
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
                '{{{PageTitle}}} {{{PageTags}}} {{{PageLink}}} {{{PageCreatedAt}}} {{#Notes}} {{{NoteHighlight}}} {{{NoteLink}}} {{{NoteCreatedAt}}} {{/Notes}}',
            ),
        ).toEqual([
            {
                PageTitle: DATA.testPageA.fullTitle,
                PageTags: joinTags(DATA.testPageATags),
                PageTagList: DATA.testPageATags,
                PageUrl: DATA.testPageAUrl,
                PageLink: expect.any(String),
                PageCreatedAt: serializeDate(DATA.testPageACreatedAt),
                title: DATA.testPageA.fullTitle,
                tags: DATA.testPageATags,
                url: DATA.testPageAUrl,
                HasNotes: true,
                Notes: [
                    {
                        PageTitle: DATA.testPageA.fullTitle,
                        PageTags: joinTags(DATA.testPageATags),
                        PageTagList: DATA.testPageATags,
                        PageUrl: DATA.testPageAUrl,
                        PageLink: expect.any(String),
                        PageCreatedAt: serializeDate(DATA.testPageACreatedAt),
                        title: DATA.testPageA.fullTitle,
                        tags: DATA.testPageATags,
                        url: DATA.testPageAUrl,
                        NoteText: DATA.testAnnotationAText,
                        NoteLink: expect.any(String),
                        NoteCreatedAt: serializeDate(
                            DATA.testAnnotationACreatedAt,
                        ),
                    },
                    {
                        PageTitle: DATA.testPageA.fullTitle,
                        PageTags: joinTags(DATA.testPageATags),
                        PageTagList: DATA.testPageATags,
                        PageUrl: DATA.testPageAUrl,
                        PageLink: expect.any(String),
                        PageCreatedAt: serializeDate(DATA.testPageACreatedAt),
                        title: DATA.testPageA.fullTitle,
                        tags: DATA.testPageATags,
                        url: DATA.testPageAUrl,
                        NoteHighlight: DATA.testAnnotationBHighlight,
                        NoteCreatedAt: serializeDate(
                            DATA.testAnnotationBCreatedAt,
                        ),
                    },
                ],
            },
            {
                PageTitle: DATA.testPageB.fullTitle,
                PageTags: joinTags(DATA.testPageBTags),
                PageTagList: DATA.testPageBTags,
                PageUrl: DATA.testPageBUrl,
                PageLink: expect.any(String),
                PageCreatedAt: serializeDate(DATA.testPageBCreatedAt),
                title: DATA.testPageB.fullTitle,
                tags: DATA.testPageBTags,
                url: DATA.testPageBUrl,
                HasNotes: true,
                Notes: [
                    {
                        PageTitle: DATA.testPageB.fullTitle,
                        PageTags: joinTags(DATA.testPageBTags),
                        PageTagList: DATA.testPageBTags,
                        PageUrl: DATA.testPageBUrl,
                        PageLink: expect.any(String),
                        PageCreatedAt: serializeDate(DATA.testPageBCreatedAt),
                        title: DATA.testPageB.fullTitle,
                        tags: DATA.testPageBTags,
                        url: DATA.testPageBUrl,
                        NoteHighlight: DATA.testAnnotationCHighlight,
                        NoteCreatedAt: serializeDate(
                            DATA.testAnnotationCCreatedAt,
                        ),
                    },
                ],
            },
        ])

        const pageLinkName = createPageLinkListTitle(currentDate)
        expect(
            await generate(
                '{{{PageTitle}}} {{{PageTags}}} {{{PageSpaces}}} {{{PageLink}}} {{#Notes}} {{{NoteHighlight}}} {{{NoteTags}}} {{{NoteSpaces}}} {{{NoteLink}}} {{/Notes}}',
            ),
        ).toEqual([
            {
                PageTitle: DATA.testPageA.fullTitle,
                PageTags: joinTags(DATA.testPageATags),
                PageTagList: DATA.testPageATags,
                PageSpaces: joinSpaces([
                    ...DATA.testPageASpaces,
                    ...DATA.testPageAPrivateSpaces,
                    pageLinkName,
                ]),
                PageSpacesList: [
                    ...DATA.testPageASpaces,
                    ...DATA.testPageAPrivateSpaces,
                    pageLinkName,
                ],
                PageUrl: DATA.testPageAUrl,
                PageLink: expect.any(String),
                title: DATA.testPageA.fullTitle,
                tags: DATA.testPageATags,
                url: DATA.testPageAUrl,
                HasNotes: true,
                Notes: [
                    {
                        PageTitle: DATA.testPageA.fullTitle,
                        PageTags: joinTags(DATA.testPageATags),
                        PageTagList: DATA.testPageATags,
                        PageSpaces: joinSpaces([
                            ...DATA.testPageASpaces,
                            ...DATA.testPageAPrivateSpaces,
                            pageLinkName,
                        ]),
                        PageSpacesList: [
                            ...DATA.testPageASpaces,
                            ...DATA.testPageAPrivateSpaces,
                            pageLinkName,
                        ],
                        PageUrl: DATA.testPageAUrl,
                        PageLink: expect.any(String),
                        title: DATA.testPageA.fullTitle,
                        tags: DATA.testPageATags,
                        url: DATA.testPageAUrl,
                        NoteText: DATA.testAnnotationAText,
                        NoteTags: joinTags(DATA.testAnnotationATags),
                        NoteTagList: DATA.testAnnotationATags,
                        NoteSpaces: joinSpaces([
                            ...DATA.testAnnotationASpaces,
                            pageLinkName,
                        ]),
                        NoteSpacesList: [
                            ...DATA.testAnnotationASpaces,
                            pageLinkName,
                        ],
                        NoteLink: expect.any(String),
                    },
                    {
                        PageTitle: DATA.testPageA.fullTitle,
                        PageTags: joinTags(DATA.testPageATags),
                        PageTagList: DATA.testPageATags,
                        PageSpaces: joinSpaces([
                            ...DATA.testPageASpaces,
                            ...DATA.testPageAPrivateSpaces,
                            pageLinkName,
                        ]),
                        PageSpacesList: [
                            ...DATA.testPageASpaces,
                            ...DATA.testPageAPrivateSpaces,
                            pageLinkName,
                        ],
                        PageUrl: DATA.testPageAUrl,
                        PageLink: expect.any(String),
                        title: DATA.testPageA.fullTitle,
                        tags: DATA.testPageATags,
                        url: DATA.testPageAUrl,
                        NoteHighlight: DATA.testAnnotationBHighlight,
                        NoteTags: joinTags(DATA.testAnnotationBTags),
                        NoteTagList: DATA.testAnnotationBTags,
                        NoteSpaces: joinSpaces([...DATA.testAnnotationBSpaces]),
                        NoteSpacesList: [...DATA.testAnnotationBSpaces],
                    },
                ],
            },
            {
                PageTitle: DATA.testPageB.fullTitle,
                PageTags: joinTags(DATA.testPageBTags),
                PageTagList: DATA.testPageBTags,
                PageSpaces: joinSpaces([...DATA.testPageBSpaces, pageLinkName]),
                PageSpacesList: [...DATA.testPageBSpaces, pageLinkName],
                PageUrl: DATA.testPageBUrl,
                PageLink: expect.any(String),
                title: DATA.testPageB.fullTitle,
                tags: DATA.testPageBTags,
                url: DATA.testPageBUrl,
                HasNotes: true,
                Notes: [
                    {
                        PageTitle: DATA.testPageB.fullTitle,
                        PageTags: joinTags(DATA.testPageBTags),
                        PageTagList: DATA.testPageBTags,
                        PageSpaces: joinSpaces([
                            ...DATA.testPageBSpaces,
                            pageLinkName,
                        ]),
                        PageSpacesList: [...DATA.testPageBSpaces, pageLinkName],
                        PageUrl: DATA.testPageBUrl,
                        PageLink: expect.any(String),
                        title: DATA.testPageB.fullTitle,
                        tags: DATA.testPageBTags,
                        url: DATA.testPageBUrl,
                        NoteHighlight: DATA.testAnnotationCHighlight,
                        NoteTags: joinTags(DATA.testAnnotationCTags),
                        NoteTagList: DATA.testAnnotationCTags,
                        // NoteSpaces: joinSpaces(DATA.testAnnotationCSpaces),
                        // NoteSpacesList: DATA.testAnnotationCSpaces,
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

        expect(
            await generate(
                '{{{NoteText}}} {{{PageTitle}}} {{{PageCreatedAt}}} {{{NoteCreatedAt}}}',
            ),
        ).toEqual([
            {
                PageTitle: DATA.testPageA.fullTitle,
                PageUrl: DATA.testPageAUrl,
                PageCreatedAt: serializeDate(DATA.testPageACreatedAt),
                NoteCreatedAt: serializeDate(DATA.testAnnotationACreatedAt),
                title: DATA.testPageA.fullTitle,
                url: DATA.testPageAUrl,
                NoteText: DATA.testAnnotationAText,
            },
            {
                PageTitle: DATA.testPageA.fullTitle,
                PageUrl: DATA.testPageAUrl,
                PageCreatedAt: serializeDate(DATA.testPageACreatedAt),
                NoteCreatedAt: serializeDate(DATA.testAnnotationBCreatedAt),
                title: DATA.testPageA.fullTitle,
                url: DATA.testPageAUrl,
                NoteHighlight: DATA.testAnnotationBHighlight,
            },
            {
                PageTitle: DATA.testPageB.fullTitle,
                PageUrl: DATA.testPageBUrl,
                PageCreatedAt: serializeDate(DATA.testPageBCreatedAt),
                NoteCreatedAt: serializeDate(DATA.testAnnotationCCreatedAt),
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
                PageSpaces: joinSpaces([
                    ...DATA.testPageASpaces,
                    ...DATA.testPageAPrivateSpaces,
                ]),
                PageSpacesList: [
                    ...DATA.testPageASpaces,
                    ...DATA.testPageAPrivateSpaces,
                ],
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
                PageSpaces: joinSpaces([
                    ...DATA.testPageASpaces,
                    ...DATA.testPageAPrivateSpaces,
                ]),
                PageSpacesList: [
                    ...DATA.testPageASpaces,
                    ...DATA.testPageAPrivateSpaces,
                ],
                PageUrl: DATA.testPageAUrl,
                title: DATA.testPageA.fullTitle,
                tags: DATA.testPageATags,
                url: DATA.testPageAUrl,
            },
        ])

        expect(
            await generateTemplateDocs({
                templateAnalysis: analyzeTemplate({
                    code:
                        '{{{PageTitle}}} {{{PageTags}}} {{{PageLink}}} {{{PageCreatedAt}}}',
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
                PageCreatedAt: serializeDate(DATA.testPageACreatedAt),
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
                NoteSpacesList: DATA.testAnnotationASpaces,
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
                '{{{NoteText}}} {{{NoteTags}}} {{{NoteSpaces}}} {{{NoteCreatedAt}}} {{{PageTitle}}} {{{PageTags}}} {{{PageSpaces}}} {{{PageCreatedAt}}}',
            ),
        ).toEqual([
            {
                PageTitle: DATA.testPageA.fullTitle,
                PageUrl: DATA.testPageAUrl,
                PageTags: joinTags(DATA.testPageATags),
                PageTagList: DATA.testPageATags,
                PageSpaces: joinSpaces([
                    ...DATA.testPageASpaces,
                    ...DATA.testPageAPrivateSpaces,
                ]),
                PageSpacesList: [
                    ...DATA.testPageASpaces,
                    ...DATA.testPageAPrivateSpaces,
                ],
                PageCreatedAt: serializeDate(DATA.testPageACreatedAt),
                NoteText: DATA.testAnnotationAText,
                NoteTags: joinTags(DATA.testAnnotationATags),
                NoteTagList: DATA.testAnnotationATags,
                NoteSpaces: joinSpaces(DATA.testAnnotationASpaces),
                NoteSpacesList: DATA.testAnnotationASpaces,
                NoteCreatedAt: serializeDate(DATA.testAnnotationACreatedAt),
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
                        '{{#Notes}}{{{NoteText}}} {{{NoteTags}}} {{{NoteSpaces}}} {{{NoteCreatedAt}}}{{/Notes}}',
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
                        NoteSpacesList: DATA.testAnnotationASpaces,
                        NoteCreatedAt: serializeDate(
                            DATA.testAnnotationACreatedAt,
                        ),
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
                PageSpaces: joinSpaces([
                    ...DATA.testPageASpaces,
                    ...DATA.testPageAPrivateSpaces,
                ]),
                PageSpacesList: [
                    ...DATA.testPageASpaces,
                    ...DATA.testPageAPrivateSpaces,
                ],
                PageUrl: DATA.testPageAUrl,

                title: DATA.testPageA.fullTitle,
                url: DATA.testPageAUrl,
            },
        ])

        expect(
            await generateTemplateDocs({
                templateAnalysis: analyzeTemplate({
                    code:
                        '{{{PageTitle}}} {{{PageTags}}} {{{PageLink}}} {{{PageCreatedAt}}}',
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
                PageCreatedAt: serializeDate(DATA.testPageACreatedAt),

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
                NoteSpacesList: DATA.testAnnotationASpaces,
            },
            {
                NoteHighlight: DATA.testAnnotationBHighlight,
                NoteSpaces: joinSpaces(DATA.testAnnotationBSpaces),
                NoteSpacesList: DATA.testAnnotationBSpaces,
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
                '{{{NoteText}}} {{{NoteCreatedAt}}} {{{PageTitle}}} {{{PageTags}}} {{{PageSpaces}}} {{{PageCreatedAt}}}',
            ),
        ).toEqual([
            {
                NoteText: DATA.testAnnotationAText,
                PageTitle: DATA.testPageA.fullTitle,
                PageTags: joinTags(DATA.testPageATags),
                PageTagList: DATA.testPageATags,
                PageSpaces: joinSpaces([
                    ...DATA.testPageASpaces,
                    ...DATA.testPageAPrivateSpaces,
                ]),
                PageSpacesList: [
                    ...DATA.testPageASpaces,
                    ...DATA.testPageAPrivateSpaces,
                ],
                PageUrl: DATA.testPageAUrl,
                PageCreatedAt: serializeDate(DATA.testPageACreatedAt),
                NoteCreatedAt: serializeDate(DATA.testAnnotationACreatedAt),

                title: DATA.testPageA.fullTitle,
                tags: DATA.testPageATags,
                url: DATA.testPageAUrl,
            },
            {
                NoteHighlight: DATA.testAnnotationBHighlight,
                PageTitle: DATA.testPageA.fullTitle,
                PageTags: joinTags(DATA.testPageATags),
                PageTagList: DATA.testPageATags,
                PageSpaces: joinSpaces([
                    ...DATA.testPageASpaces,
                    ...DATA.testPageAPrivateSpaces,
                ]),
                PageSpacesList: [
                    ...DATA.testPageASpaces,
                    ...DATA.testPageAPrivateSpaces,
                ],
                PageUrl: DATA.testPageAUrl,
                PageCreatedAt: serializeDate(DATA.testPageACreatedAt),
                NoteCreatedAt: serializeDate(DATA.testAnnotationBCreatedAt),

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
                        NoteSpacesList: DATA.testAnnotationASpaces,
                    },
                    {
                        NoteHighlight: DATA.testAnnotationBHighlight,
                        NoteSpaces: joinSpaces(DATA.testAnnotationBSpaces),
                        NoteSpacesList: DATA.testAnnotationBSpaces,
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
                HasNotes: true,
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
                '{{#Notes}}{{{NoteText}}} {{{NoteTags}}} {{{NoteCreatedAt}}} {{{NoteSpaces}}}{{/Notes}} {{{PageCreatedAt}}} {{{PageTitle}}} {{{PageTags}}} {{{PageSpaces}}}',
            ),
        ).toEqual([
            {
                PageUrl: DATA.testPageAUrl,
                PageTitle: DATA.testPageA.fullTitle,
                PageTags: joinTags(DATA.testPageATags),
                PageTagList: DATA.testPageATags,
                PageSpaces: joinSpaces([
                    ...DATA.testPageASpaces,
                    ...DATA.testPageAPrivateSpaces,
                ]),
                PageSpacesList: [
                    ...DATA.testPageASpaces,
                    ...DATA.testPageAPrivateSpaces,
                ],
                PageCreatedAt: serializeDate(DATA.testPageACreatedAt),
                url: DATA.testPageAUrl,
                tags: DATA.testPageATags,
                title: DATA.testPageA.fullTitle,
                HasNotes: true,
                Notes: [
                    {
                        NoteText: DATA.testAnnotationAText,
                        NoteTags: joinTags(DATA.testAnnotationATags),
                        NoteTagList: DATA.testAnnotationATags,
                        NoteSpaces: joinSpaces(DATA.testAnnotationASpaces),
                        NoteSpacesList: DATA.testAnnotationASpaces,
                        NoteCreatedAt: serializeDate(
                            DATA.testAnnotationACreatedAt,
                        ),
                        PageCreatedAt: serializeDate(DATA.testPageACreatedAt),
                        PageUrl: DATA.testPageAUrl,
                        PageTitle: DATA.testPageA.fullTitle,
                        PageTags: joinTags(DATA.testPageATags),
                        PageTagList: DATA.testPageATags,
                        PageSpaces: joinSpaces([
                            ...DATA.testPageASpaces,
                            ...DATA.testPageAPrivateSpaces,
                        ]),
                        PageSpacesList: [
                            ...DATA.testPageASpaces,
                            ...DATA.testPageAPrivateSpaces,
                        ],
                        url: DATA.testPageAUrl,
                        tags: DATA.testPageATags,
                        title: DATA.testPageA.fullTitle,
                    },
                    {
                        NoteHighlight: DATA.testAnnotationBHighlight,
                        NoteTags: joinTags(DATA.testAnnotationBTags),
                        NoteTagList: DATA.testAnnotationBTags,
                        NoteSpaces: joinSpaces(DATA.testAnnotationBSpaces),
                        NoteSpacesList: DATA.testAnnotationBSpaces,
                        NoteCreatedAt: serializeDate(
                            DATA.testAnnotationBCreatedAt,
                        ),
                        PageCreatedAt: serializeDate(DATA.testPageACreatedAt),
                        PageUrl: DATA.testPageAUrl,
                        PageTitle: DATA.testPageA.fullTitle,
                        PageTags: joinTags(DATA.testPageATags),
                        PageTagList: DATA.testPageATags,
                        PageSpaces: joinSpaces([
                            ...DATA.testPageASpaces,
                            ...DATA.testPageAPrivateSpaces,
                        ]),
                        PageSpacesList: [
                            ...DATA.testPageASpaces,
                            ...DATA.testPageAPrivateSpaces,
                        ],
                        url: DATA.testPageAUrl,
                        tags: DATA.testPageATags,
                        title: DATA.testPageA.fullTitle,
                    },
                ],
            },
        ])

        expect(
            await generate(
                '{{#Notes}}{{{NoteText}}} {{{NoteTags}}} {{{NoteCreatedAt}}} {{#NoteSpacesList}} {{{.}}} {{/NoteSpacesList}}{{/Notes}} {{{PageCreatedAt}}} {{{PageTitle}}} {{{PageTags}}} {{#PageSpacesList}} {{{.}}} {{/PageSpacesList}}',
            ),
        ).toEqual([
            {
                PageUrl: DATA.testPageAUrl,
                PageTitle: DATA.testPageA.fullTitle,
                PageTags: joinTags(DATA.testPageATags),
                PageTagList: DATA.testPageATags,
                PageSpaces: joinSpaces([
                    ...DATA.testPageASpaces,
                    ...DATA.testPageAPrivateSpaces,
                ]),
                PageSpacesList: [
                    ...DATA.testPageASpaces,
                    ...DATA.testPageAPrivateSpaces,
                ],
                PageCreatedAt: serializeDate(DATA.testPageACreatedAt),
                url: DATA.testPageAUrl,
                tags: DATA.testPageATags,
                title: DATA.testPageA.fullTitle,
                HasNotes: true,
                Notes: [
                    {
                        NoteText: DATA.testAnnotationAText,
                        NoteTags: joinTags(DATA.testAnnotationATags),
                        NoteTagList: DATA.testAnnotationATags,
                        NoteSpaces: joinSpaces(DATA.testAnnotationASpaces),
                        NoteSpacesList: DATA.testAnnotationASpaces,
                        NoteCreatedAt: serializeDate(
                            DATA.testAnnotationACreatedAt,
                        ),
                        PageCreatedAt: serializeDate(DATA.testPageACreatedAt),
                        PageUrl: DATA.testPageAUrl,
                        PageTitle: DATA.testPageA.fullTitle,
                        PageTags: joinTags(DATA.testPageATags),
                        PageTagList: DATA.testPageATags,
                        PageSpaces: joinSpaces([
                            ...DATA.testPageASpaces,
                            ...DATA.testPageAPrivateSpaces,
                        ]),
                        PageSpacesList: [
                            ...DATA.testPageASpaces,
                            ...DATA.testPageAPrivateSpaces,
                        ],
                        url: DATA.testPageAUrl,
                        tags: DATA.testPageATags,
                        title: DATA.testPageA.fullTitle,
                    },
                    {
                        NoteHighlight: DATA.testAnnotationBHighlight,
                        NoteTags: joinTags(DATA.testAnnotationBTags),
                        NoteTagList: DATA.testAnnotationBTags,
                        NoteSpaces: joinSpaces(DATA.testAnnotationBSpaces),
                        NoteSpacesList: DATA.testAnnotationBSpaces,
                        NoteCreatedAt: serializeDate(
                            DATA.testAnnotationBCreatedAt,
                        ),
                        PageCreatedAt: serializeDate(DATA.testPageACreatedAt),
                        PageUrl: DATA.testPageAUrl,
                        PageTitle: DATA.testPageA.fullTitle,
                        PageTags: joinTags(DATA.testPageATags),
                        PageTagList: DATA.testPageATags,
                        PageSpaces: joinSpaces([
                            ...DATA.testPageASpaces,
                            ...DATA.testPageAPrivateSpaces,
                        ]),
                        PageSpacesList: [
                            ...DATA.testPageASpaces,
                            ...DATA.testPageAPrivateSpaces,
                        ],
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

        const currentDate = new Date()
        const generate = (template: string) =>
            generateTemplateDocs({
                templateAnalysis: analyzeTemplate({ code: template }),
                normalizedPageUrls: [DATA.testPageA.url],
                annotationUrls: [
                    DATA.testAnnotationAUrl,
                    DATA.testAnnotationBUrl,
                ],
                dataFetchers,
                now: currentDate.valueOf(),
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
                HasNotes: true,
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
                        PageUrl: DATA.testPageAUrl,
                        PageTitle: DATA.testPageA.fullTitle,
                        PageLink: expect.any(String), // TODO: properly set once implemented
                        url: DATA.testPageAUrl,
                        title: DATA.testPageA.fullTitle,
                    },
                ],
            },
        ])

        const pageLinkName = createPageLinkListTitle(currentDate)
        expect(
            await generate(
                '{{#Notes}}{{{NoteText}}} {{{NoteLink}}} {{{NoteTags}}} {{{NoteCreatedAt}}} {{{NoteSpaces}}}{{/Notes}} {{{PageLink}}} {{{PageTitle}}} {{{PageCreatedAt}}}',
            ),
        ).toEqual([
            {
                PageUrl: DATA.testPageAUrl,
                PageTitle: DATA.testPageA.fullTitle,
                PageLink: expect.any(String), // TODO: properly set once implemented
                PageCreatedAt: serializeDate(DATA.testPageACreatedAt),
                url: DATA.testPageAUrl,
                title: DATA.testPageA.fullTitle,
                HasNotes: true,
                Notes: [
                    {
                        NoteText: DATA.testAnnotationAText,
                        NoteLink: expect.any(String), // TODO: properly set once implemented
                        NoteTags: joinTags(DATA.testAnnotationATags),
                        NoteTagList: DATA.testAnnotationATags,
                        NoteSpaces: joinSpaces([
                            ...DATA.testAnnotationASpaces,
                            pageLinkName,
                        ]),
                        NoteSpacesList: [
                            ...DATA.testAnnotationASpaces,
                            pageLinkName,
                        ],
                        NoteCreatedAt: serializeDate(
                            DATA.testAnnotationACreatedAt,
                        ),
                        PageUrl: DATA.testPageAUrl,
                        PageTitle: DATA.testPageA.fullTitle,
                        PageLink: expect.any(String), // TODO: properly set once implemented
                        PageCreatedAt: serializeDate(DATA.testPageACreatedAt),
                        url: DATA.testPageAUrl,
                        title: DATA.testPageA.fullTitle,
                    },
                    {
                        NoteHighlight: DATA.testAnnotationBHighlight,
                        NoteTags: joinTags(DATA.testAnnotationBTags),
                        NoteTagList: DATA.testAnnotationBTags,
                        NoteSpaces: joinSpaces(DATA.testAnnotationBSpaces),
                        NoteSpacesList: DATA.testAnnotationBSpaces,
                        NoteCreatedAt: serializeDate(
                            DATA.testAnnotationBCreatedAt,
                        ),
                        PageUrl: DATA.testPageAUrl,
                        PageTitle: DATA.testPageA.fullTitle,
                        PageLink: expect.any(String), // TODO: properly set once implemented
                        PageCreatedAt: serializeDate(DATA.testPageACreatedAt),
                        url: DATA.testPageAUrl,
                        title: DATA.testPageA.fullTitle,
                    },
                ],
            },
        ])
    })
})
