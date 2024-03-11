import type {
    PageEntity,
    PageMetadata,
} from '@worldbrain/memex-common/lib/types/core-data-types/client'
import type {
    TemplateDataFetchers,
    PageTemplateData,
    NoteTemplateData,
    TemplateAnalysis,
    UrlMappedData,
    TemplateDoc,
} from './types'
import fromPairs from 'lodash/fromPairs'

interface GeneratorInput {
    templateAnalysis: TemplateAnalysis
    dataFetchers: TemplateDataFetchers
    normalizedPageUrls: string[]
    annotationUrls: string[]
    now?: number
}

export const joinTags = (tags?: string[]): string | undefined =>
    tags == null
        ? undefined
        : tags.reduce(
              (acc, tag, i) =>
                  `${acc}#${tag}${i === tags.length - 1 ? '' : ' '}`,
              '',
          )

export const joinSpaces = (spaceNames?: string[]): string | undefined =>
    spaceNames == null
        ? undefined
        : spaceNames.reduce(
              (acc, spaceName, i) =>
                  `${acc}${
                      spaceName.includes(' ')
                          ? `[[${spaceName}]]`
                          : `#${spaceName}`
                  }${i === spaceNames.length - 1 ? '' : ' '}`,
              '',
          )

export const serializeDate = (date?: Date | number): number | undefined => {
    if (date == null) {
        return undefined
    }
    if (typeof date === 'number') {
        date = new Date(date)
    }
    return date.valueOf()
}

const groupDataByPages = <T>(
    data: UrlMappedData<T>,
    getPageUrl: (datum: T) => string,
): UrlMappedData<T[]> => {
    const grouped: UrlMappedData<T[]> = {}

    for (const datum of Object.values(data)) {
        const pageUrl = getPageUrl(datum)
        grouped[pageUrl] = [...(grouped[pageUrl] ?? []), datum]
    }

    return grouped
}

const omitEmptyFields = (docs: TemplateDoc[]): TemplateDoc[] =>
    docs.map((doc) => {
        if (doc.Notes) {
            doc.Notes = doc.Notes.map(omitEmpty)
        }
        if (doc.PageEntities) {
            doc.PageEntities = doc.PageEntities.map(omitEmpty)
        }
        if (doc.Pages) {
            doc.Pages = doc.Pages.map(
                ({ Notes, PageEntities, ...pageTemplateDoc }) => ({
                    ...omitEmpty(pageTemplateDoc),
                    Notes: Notes?.map(omitEmpty) ?? [],
                    PageEntities: PageEntities?.map(omitEmpty) ?? [],
                }),
            )
        }
        return omitEmpty(doc)
    })

const omitEmpty = <T extends any>(obj: T): T => {
    const clone = { ...(obj as any) }
    for (const key in clone) {
        if (
            clone[key] == null ||
            (typeof clone[key] === 'string' && clone[key]?.length === 0)
        ) {
            delete clone[key]
        }
    }
    return clone
}

// This function covers all single page cases + multi-page cases when no notes are referenced
const generateForPages = async ({
    templateAnalysis,
    dataFetchers,
    ...params
}: GeneratorInput): Promise<TemplateDoc[]> => {
    const pageData = await dataFetchers.getPages(params.normalizedPageUrls)

    let pageTags: UrlMappedData<string[]> = {}
    let pageMetadata: UrlMappedData<PageMetadata> = {}
    let pageEntities: UrlMappedData<PageEntity[]> = {}
    let pageSpaces: UrlMappedData<string[]> = {}
    let pageCreatedAt: UrlMappedData<Date> = {}
    let noteTags: UrlMappedData<string[]> = {}
    let noteSpaces: UrlMappedData<string[]> = {}
    let noteLinks: UrlMappedData<string> = {}
    let notes: UrlMappedData<NoteTemplateData> = {}
    let noteUrlsForPages: UrlMappedData<string[]> = {}

    if (templateAnalysis.requirements.pageTags) {
        pageTags = await dataFetchers.getTagsForPages(params.normalizedPageUrls)
    }

    if (templateAnalysis.requirements.pageSpaces) {
        pageSpaces = await dataFetchers.getSpacesForPages(
            params.normalizedPageUrls,
        )
    }

    if (templateAnalysis.requirements.pageMetadata) {
        pageMetadata = await dataFetchers.getMetadataForPages(
            params.normalizedPageUrls,
        )
    }

    if (templateAnalysis.requirements.pageEntities) {
        pageEntities = await dataFetchers.getEntitiesForPages(
            params.normalizedPageUrls,
        )
    }

    if (templateAnalysis.requirements.pageCreatedAt) {
        pageCreatedAt = await dataFetchers.getCreatedAtForPages(
            params.normalizedPageUrls,
        )
    }

    if (
        templateAnalysis.requirements.note ||
        templateAnalysis.requirements.noteTags ||
        templateAnalysis.requirements.noteSpaces ||
        templateAnalysis.requirements.noteLink ||
        templateAnalysis.requirements.noteCreatedAt
    ) {
        noteUrlsForPages = await dataFetchers.getNoteIdsForPages(
            params.normalizedPageUrls,
        )
    }
    // At this point, all needed data is fetched and we decide how to shape the template doc

    const templateDocs: TemplateDoc[] = []

    for (const [normalizedPageUrl, { fullTitle, fullUrl }] of Object.entries(
        pageData,
    )) {
        const tags = pageTags[normalizedPageUrl] ?? []
        const spaces = pageSpaces[normalizedPageUrl] ?? []
        const noteUrls = noteUrlsForPages[normalizedPageUrl] ?? []

        if (templateAnalysis.requirements.note) {
            notes = await dataFetchers.getNotes(noteUrls)
        }

        if (templateAnalysis.requirements.noteTags) {
            noteTags = await dataFetchers.getTagsForNotes(noteUrls)
        }

        if (templateAnalysis.requirements.noteSpaces) {
            noteSpaces = await dataFetchers.getSpacesForNotes(noteUrls)
        }

        if (templateAnalysis.requirements.noteLink) {
            noteLinks = await dataFetchers.getNoteLinks(noteUrls)
        }

        const pageLink =
            templateAnalysis.requirements.pageLink &&
            (
                await dataFetchers.getPageLinks(
                    {
                        [normalizedPageUrl]: { annotationUrls: noteUrls },
                    },
                    params.now,
                )
            )[normalizedPageUrl]

        templateDocs.push({
            PageTitle: fullTitle,
            PageTags: joinTags(tags),
            PageTagList: tags,
            PageSpaces: joinSpaces(spaces),
            PageSpacesList: spaces,
            PageUrl: fullUrl,
            PageLink: pageLink,
            PageCreatedAt: serializeDate(pageCreatedAt[normalizedPageUrl]),

            PageDOI: pageMetadata[normalizedPageUrl]?.doi,
            PageMetaTitle: pageMetadata[normalizedPageUrl]?.title,
            PageAnnotation: pageMetadata[normalizedPageUrl]?.annotation,
            PageSourceName: pageMetadata[normalizedPageUrl]?.sourceName,
            PageJournalName: pageMetadata[normalizedPageUrl]?.journalName,
            PageJournalPage: pageMetadata[normalizedPageUrl]?.journalPage,
            PageJournalIssue: pageMetadata[normalizedPageUrl]?.journalIssue,
            PageJournalVolume: pageMetadata[normalizedPageUrl]?.journalVolume,
            PageReleaseDate: serializeDate(
                pageMetadata[normalizedPageUrl]?.releaseDate,
            ),
            PageAccessDate: serializeDate(
                pageMetadata[normalizedPageUrl]?.accessDate,
            ),

            PageEntities: pageEntities[normalizedPageUrl]?.map((entity) => ({
                EntityName: entity.name,
                EntityAdditionalName: entity.additionalName,
            })),

            HasNotes: noteUrls.length > 0,
            Notes: noteUrls.map((url) => ({
                NoteText: notes[url]?.comment,
                NoteHighlight: notes[url]?.body,
                NoteTagList: noteTags[url],
                NoteTags: joinTags(noteTags[url]),
                NoteSpacesList: noteSpaces[url],
                NoteSpaces: joinSpaces(noteSpaces[url]),
                NoteLink: noteLinks[url],
                NoteCreatedAt: templateAnalysis.requirements.noteCreatedAt
                    ? serializeDate(notes[url]?.createdAt)
                    : undefined,
            })),

            title: fullTitle,
            tags,
            url: fullUrl,
        })
    }

    return templateAnalysis.expectedContext === 'page-list'
        ? [{ Pages: templateDocs }]
        : templateDocs
}

// This function covers all single + multi-note cases + multi-page cases when notes are referenced
const generateForNotes = async ({
    templateAnalysis,
    dataFetchers,
    ...params
}: GeneratorInput): Promise<TemplateDoc[]> => {
    const notes = await dataFetchers.getNotes(params.annotationUrls)
    const notesByPageUrl = groupDataByPages(notes, (note) => note.pageUrl)
    let noteTags: UrlMappedData<string[]> = {}
    let noteSpaces: UrlMappedData<string[]> = {}
    let noteLinks: UrlMappedData<string> = {}

    let pages: UrlMappedData<PageTemplateData> = {}
    let pageTags: UrlMappedData<string[]> = {}
    let pageEntities: UrlMappedData<PageEntity[]> = {}
    let pageMetadata: UrlMappedData<PageMetadata> = {}
    let pageSpaces: UrlMappedData<string[]> = {}
    let pageLinks: UrlMappedData<string> = {}
    let pageCreatedAt: UrlMappedData<Date> = {}

    if (templateAnalysis.requirements.page) {
        pages = await dataFetchers.getPages(params.normalizedPageUrls)
    }

    if (templateAnalysis.requirements.pageTags) {
        pageTags = await dataFetchers.getTagsForPages(params.normalizedPageUrls)
    }

    if (templateAnalysis.requirements.pageSpaces) {
        pageSpaces = await dataFetchers.getSpacesForPages(
            params.normalizedPageUrls,
        )
    }

    if (templateAnalysis.requirements.pageMetadata) {
        pageMetadata = await dataFetchers.getMetadataForPages(
            params.normalizedPageUrls,
        )
    }

    if (templateAnalysis.requirements.pageEntities) {
        pageEntities = await dataFetchers.getEntitiesForPages(
            params.normalizedPageUrls,
        )
    }

    if (templateAnalysis.requirements.pageCreatedAt) {
        pageCreatedAt = await dataFetchers.getCreatedAtForPages(
            params.normalizedPageUrls,
        )
    }

    if (templateAnalysis.requirements.noteTags) {
        noteTags = await dataFetchers.getTagsForNotes(params.annotationUrls)
    }

    if (templateAnalysis.requirements.noteSpaces) {
        noteSpaces = await dataFetchers.getSpacesForNotes(params.annotationUrls)
    }

    if (templateAnalysis.requirements.pageLink) {
        pageLinks = await dataFetchers.getPageLinks(
            fromPairs(
                params.normalizedPageUrls.map((normalizedPageUrl) => [
                    normalizedPageUrl,
                    {
                        annotationUrls: Object.values(notes)
                            .filter((note) => note.pageUrl)
                            .map((note) => note.url),
                    },
                ]),
            ),
        )
    }

    if (templateAnalysis.requirements.noteLink) {
        noteLinks = await dataFetchers.getNoteLinks(params.annotationUrls)
    }
    // At this point, all needed data is fetched and we decide how to shape the template doc

    // User clicked to copy all notes on page but they only want to render page info, so set only page data
    if (
        !templateAnalysis.requirements.note &&
        !templateAnalysis.requirements.noteLink &&
        !templateAnalysis.requirements.noteTags &&
        !templateAnalysis.requirements.noteSpaces &&
        !templateAnalysis.requirements.noteCreatedAt
    ) {
        const templateDocs: TemplateDoc[] = []

        for (const [pageUrl, { fullTitle, fullUrl }] of Object.entries(pages)) {
            templateDocs.push({
                PageTitle: fullTitle,
                PageTags: joinTags(pageTags[pageUrl]),
                PageTagList: pageTags[pageUrl],
                PageSpaces: joinSpaces(pageSpaces[pageUrl]),
                PageSpacesList: pageSpaces[pageUrl],
                PageUrl: fullUrl,
                PageLink: pageLinks[pageUrl],
                PageCreatedAt: serializeDate(pageCreatedAt[pageUrl]),

                PageEntities: pageEntities[pageUrl]?.map((entity) => ({
                    EntityName: entity.name,
                    EntityAdditionalName: entity.additionalName,
                })),

                PageDOI: pageMetadata[pageUrl]?.doi,
                PageMetaTitle: pageMetadata[pageUrl]?.title,
                PageAnnotation: pageMetadata[pageUrl]?.annotation,
                PageSourceName: pageMetadata[pageUrl]?.sourceName,
                PageJournalName: pageMetadata[pageUrl]?.journalName,
                PageJournalPage: pageMetadata[pageUrl]?.journalPage,
                PageJournalIssue: pageMetadata[pageUrl]?.journalIssue,
                PageJournalVolume: pageMetadata[pageUrl]?.journalVolume,
                PageReleaseDate: serializeDate(
                    pageMetadata[pageUrl]?.releaseDate,
                ),
                PageAccessDate: serializeDate(
                    pageMetadata[pageUrl]?.accessDate,
                ),

                title: fullTitle,
                tags: pageTags[pageUrl],
                url: fullUrl,
            })
        }

        return templateDocs
    }

    if (templateAnalysis.expectedContext === 'note') {
        // but they are using the top-level data (NoteText, etc.) so return
        const templateDocs: TemplateDoc[] = []

        for (const [
            noteUrl,
            { body, comment, pageUrl, createdAt },
        ] of Object.entries(notes)) {
            const pageData = pages[pageUrl] ?? ({} as PageTemplateData)

            templateDocs.push({
                NoteText: comment,
                NoteHighlight: body,
                NoteTagList: noteTags[noteUrl],
                NoteTags: joinTags(noteTags[noteUrl]),
                NoteSpacesList: noteSpaces[noteUrl],
                NoteSpaces: joinSpaces(noteSpaces[noteUrl]),
                NoteLink: noteLinks[noteUrl],
                NoteCreatedAt: templateAnalysis.requirements.noteCreatedAt
                    ? serializeDate(createdAt)
                    : undefined,

                PageTitle: pageData.fullTitle,
                PageUrl: pageData.fullUrl,
                PageTags: joinTags(pageTags[pageUrl]),
                PageTagList: pageTags[pageUrl],
                PageSpaces: joinSpaces(pageSpaces[pageUrl]),
                PageSpacesList: pageSpaces[pageUrl],
                PageLink: pageLinks[pageUrl],
                PageCreatedAt: serializeDate(pageCreatedAt[pageUrl]),

                PageEntities: pageEntities[pageUrl]?.map((entity) => ({
                    EntityName: entity.name,
                    EntityAdditionalName: entity.additionalName,
                })),

                PageDOI: pageMetadata[pageUrl]?.doi,
                PageMetaTitle: pageMetadata[pageUrl]?.title,
                PageAnnotation: pageMetadata[pageUrl]?.annotation,
                PageSourceName: pageMetadata[pageUrl]?.sourceName,
                PageJournalName: pageMetadata[pageUrl]?.journalName,
                PageJournalPage: pageMetadata[pageUrl]?.journalPage,
                PageJournalIssue: pageMetadata[pageUrl]?.journalIssue,
                PageJournalVolume: pageMetadata[pageUrl]?.journalVolume,
                PageReleaseDate: serializeDate(
                    pageMetadata[pageUrl]?.releaseDate,
                ),
                PageAccessDate: serializeDate(
                    pageMetadata[pageUrl]?.accessDate,
                ),

                title: pageData.fullTitle,
                url: pageData.fullUrl,
                tags: pageTags[pageUrl],
            })
        }

        return templateDocs
    }

    // Everything after here is in the context of 'page' or 'page-list'

    // If page is not required, we simply need to set the array of Notes
    if (!templateAnalysis.requirements.page) {
        const templateDocs: TemplateDoc[] = []
        for (const [
            noteUrl,
            { body, comment, createdAt, pageUrl },
        ] of Object.entries(notes)) {
            templateDocs.push({
                NoteText: comment,
                NoteHighlight: body,
                NoteTagList: noteTags[noteUrl],
                NoteTags: joinTags(noteTags[noteUrl]),
                NoteSpacesList: noteSpaces[noteUrl],
                NoteSpaces: joinSpaces(noteSpaces[noteUrl]),
                NoteLink: noteLinks[noteUrl],
                NoteCreatedAt: templateAnalysis.requirements.noteCreatedAt
                    ? serializeDate(createdAt)
                    : undefined,

                PageEntities: pageEntities[pageUrl]?.map((entity) => ({
                    EntityName: entity.name,
                    EntityAdditionalName: entity.additionalName,
                })),

                PageDOI: pageMetadata[pageUrl]?.doi,
                PageMetaTitle: pageMetadata[pageUrl]?.title,
                PageAnnotation: pageMetadata[pageUrl]?.annotation,
                PageSourceName: pageMetadata[pageUrl]?.sourceName,
                PageJournalName: pageMetadata[pageUrl]?.journalName,
                PageJournalPage: pageMetadata[pageUrl]?.journalPage,
                PageJournalIssue: pageMetadata[pageUrl]?.journalIssue,
                PageJournalVolume: pageMetadata[pageUrl]?.journalVolume,
                PageReleaseDate: serializeDate(
                    pageMetadata[pageUrl]?.releaseDate,
                ),
                PageAccessDate: serializeDate(
                    pageMetadata[pageUrl]?.accessDate,
                ),
            })
        }

        return [{ Notes: templateDocs }]
    }

    const docs: TemplateDoc[] = []

    // This covers all other cases where notes are needed
    for (const [pageUrl, { fullUrl, fullTitle }] of Object.entries(pages)) {
        docs.push({
            PageTitle: fullTitle,
            PageUrl: fullUrl,
            PageTags: joinTags(pageTags[pageUrl]),
            PageTagList: pageTags[pageUrl],
            PageSpaces: joinSpaces(pageSpaces[pageUrl]),
            PageSpacesList: pageSpaces[pageUrl],
            PageLink: pageLinks[pageUrl],
            PageCreatedAt: serializeDate(pageCreatedAt[pageUrl]),
            HasNotes: notesByPageUrl[pageUrl].length > 0,

            PageDOI: pageMetadata[pageUrl]?.doi,
            PageMetaTitle: pageMetadata[pageUrl]?.title,
            PageAnnotation: pageMetadata[pageUrl]?.annotation,
            PageSourceName: pageMetadata[pageUrl]?.sourceName,
            PageJournalName: pageMetadata[pageUrl]?.journalName,
            PageJournalPage: pageMetadata[pageUrl]?.journalPage,
            PageJournalIssue: pageMetadata[pageUrl]?.journalIssue,
            PageJournalVolume: pageMetadata[pageUrl]?.journalVolume,
            PageReleaseDate: serializeDate(pageMetadata[pageUrl]?.releaseDate),
            PageAccessDate: serializeDate(pageMetadata[pageUrl]?.accessDate),

            title: fullTitle,
            url: fullUrl,
            tags: pageTags[pageUrl],

            PageEntities: pageEntities[pageUrl]?.map((entity) => ({
                EntityName: entity.name,
                EntityAdditionalName: entity.additionalName,
            })),

            Notes: notesByPageUrl[pageUrl].map(
                ({ url: noteUrl, body, comment, createdAt }) => ({
                    NoteText: comment,
                    NoteHighlight: body,
                    NoteTagList: noteTags[noteUrl],
                    NoteTags: joinTags(noteTags[noteUrl]),
                    NoteSpacesList: noteSpaces[noteUrl],
                    NoteSpaces: joinSpaces(noteSpaces[noteUrl]),
                    NoteLink: noteLinks[noteUrl],
                    NoteCreatedAt: templateAnalysis.requirements.noteCreatedAt
                        ? serializeDate(createdAt)
                        : undefined,

                    PageTitle: fullTitle,
                    PageUrl: fullUrl,
                    PageTags: joinTags(pageTags[pageUrl]),
                    PageTagList: pageTags[pageUrl],
                    PageSpaces: joinSpaces(pageSpaces[pageUrl]),
                    PageSpacesList: pageSpaces[pageUrl],
                    PageLink: pageLinks[pageUrl],
                    PageCreatedAt: serializeDate(pageCreatedAt[pageUrl]),

                    PageDOI: pageMetadata[pageUrl]?.doi,
                    PageMetaTitle: pageMetadata[pageUrl]?.title,
                    PageAnnotation: pageMetadata[pageUrl]?.annotation,
                    PageSourceName: pageMetadata[pageUrl]?.sourceName,
                    PageJournalName: pageMetadata[pageUrl]?.journalName,
                    PageJournalPage: pageMetadata[pageUrl]?.journalPage,
                    PageJournalIssue: pageMetadata[pageUrl]?.journalIssue,
                    PageJournalVolume: pageMetadata[pageUrl]?.journalVolume,
                    PageReleaseDate: serializeDate(
                        pageMetadata[pageUrl]?.releaseDate,
                    ),
                    PageAccessDate: serializeDate(
                        pageMetadata[pageUrl]?.accessDate,
                    ),

                    title: fullTitle,
                    url: fullUrl,
                    tags: pageTags[pageUrl],
                }),
            ),
        })
    }

    return templateAnalysis.expectedContext === 'page-list'
        ? [{ Pages: docs }]
        : docs
}

export default async function generateTemplateDocs(
    params: GeneratorInput,
): Promise<TemplateDoc[]> {
    let docs: TemplateDoc[] = []

    // This condition is needed as under some contexts, notes aren't specified upfront (page copy-paster), but users can still reference a page's notes in their templates
    //  so we need to get the note URLs by looking them up using the page URLs
    // TODO: Can we just have one function but fetch the note URLs in this parent scope (if needed) and pass them down?
    if (!params.annotationUrls.length) {
        docs = await generateForPages(params)
    } else if (params.annotationUrls.length >= 1) {
        docs = await generateForNotes(params)
    }

    return [...omitEmptyFields(docs)]
}
