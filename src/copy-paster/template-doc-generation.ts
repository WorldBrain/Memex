import {
    TemplateDataFetchers,
    PageTemplateData,
    TemplateDoc,
    NoteTemplateData,
    TemplateAnalysis,
} from './types'
import fromPairs from 'lodash/fromPairs'

interface GeneratorInput {
    templateAnalysis: TemplateAnalysis
    dataFetchers: TemplateDataFetchers
    normalizedPageUrls: string[]
    annotationUrls: string[]
}

/** Simply exists to attempt to clean up typedefs for some intermediate variables. */
interface UrlMappedData<T> {
    [url: string]: T
}

export const joinTags = (tags?: string[]): string | undefined =>
    tags == null
        ? undefined
        : tags.reduce(
              (acc, tag, i) =>
                  `${acc}#${tag}${i === tags.length - 1 ? '' : ' '}`,
              '',
          )

const groupNotesByPages = (
    notes: UrlMappedData<NoteTemplateData>,
): UrlMappedData<NoteTemplateData[]> => {
    const grouped: UrlMappedData<NoteTemplateData[]> = {}

    for (const { pageUrl, ...noteData } of Object.values(notes)) {
        grouped[pageUrl] = [
            ...(grouped[pageUrl] ?? []),
            { pageUrl, ...noteData },
        ]
    }

    return grouped
}

const omitEmptyFields = (docs: TemplateDoc[]): TemplateDoc[] =>
    docs.map((doc) => {
        if (doc.Notes) {
            doc.Notes = doc.Notes.map(omitEmpty)
        }
        if (doc.Pages) {
            doc.Pages = doc.Pages.map(({ Notes, ...pageTemplateDoc }) => {
                if (!Notes?.length) {
                    return omitEmpty(pageTemplateDoc)
                }

                return {
                    ...omitEmpty(pageTemplateDoc),
                    Notes: Notes.map(omitEmpty),
                }
            })
        }
        return omitEmpty(doc)
    })

const omitEmpty = <T extends any>(obj: T): T => {
    const clone = { ...obj }
    for (const key in clone) {
        if (clone[key] == null || clone[key]?.length === 0) {
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

    let noteLinks: UrlMappedData<string> = {}
    let pageTags: UrlMappedData<string[]> = {}
    let noteTags: UrlMappedData<string[]> = {}
    let notes: UrlMappedData<NoteTemplateData> = {}
    let noteUrlsForPages: UrlMappedData<string[]> = {}

    if (templateAnalysis.requirements.pageTags) {
        pageTags = await dataFetchers.getTagsForPages(params.normalizedPageUrls)
    }

    if (
        templateAnalysis.requirements.note ||
        templateAnalysis.requirements.noteTags ||
        templateAnalysis.requirements.noteLink
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
        const noteUrls = noteUrlsForPages[normalizedPageUrl] ?? []

        if (templateAnalysis.requirements.note) {
            notes = await dataFetchers.getNotes(noteUrls)
        }

        if (templateAnalysis.requirements.noteTags) {
            noteTags = await dataFetchers.getTagsForNotes(noteUrls)
        }

        if (templateAnalysis.requirements.noteLink) {
            noteLinks = await dataFetchers.getNoteLinks(noteUrls)
        }

        const pageLink =
            templateAnalysis.requirements.pageLink &&
            (
                await dataFetchers.getPageLinks({
                    [normalizedPageUrl]: { annotationUrls: noteUrls },
                })
            )[normalizedPageUrl]

        templateDocs.push({
            PageTitle: fullTitle,
            PageTags: joinTags(tags),
            PageTagList: tags,
            PageUrl: fullUrl,
            PageLink: pageLink,

            Notes: noteUrls.map((url) => ({
                NoteText: notes[url].comment,
                NoteHighlight: notes[url].body,
                NoteTagList: noteTags[url],
                NoteTags: joinTags(noteTags[url]),
                NoteLink: noteLinks[url],
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
    const notesByPageUrl = groupNotesByPages(notes)
    let noteTags: UrlMappedData<string[]> = {}
    let noteLinks: UrlMappedData<string> = {}

    let pages: UrlMappedData<PageTemplateData> = {}
    let pageTags: UrlMappedData<string[]> = {}
    let pageLinks: UrlMappedData<string> = {}

    if (templateAnalysis.requirements.page) {
        pages = await dataFetchers.getPages(params.normalizedPageUrls)
    }

    if (templateAnalysis.requirements.pageTags) {
        pageTags = await dataFetchers.getTagsForPages(params.normalizedPageUrls)
    }

    if (templateAnalysis.requirements.noteTags) {
        noteTags = await dataFetchers.getTagsForNotes(params.annotationUrls)
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
        !templateAnalysis.requirements.noteTags
    ) {
        const templateDocs: TemplateDoc[] = []

        for (const [pageUrl, { fullTitle, fullUrl }] of Object.entries(pages)) {
            templateDocs.push({
                PageTitle: fullTitle,
                PageTags: joinTags(pageTags[pageUrl]),
                PageTagList: pageTags[pageUrl],
                PageUrl: fullUrl,
                PageLink: pageLinks[pageUrl],

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

        for (const [noteUrl, { body, comment, pageUrl }] of Object.entries(
            notes,
        )) {
            const pageData = pages[pageUrl] ?? ({} as PageTemplateData)

            templateDocs.push({
                NoteText: comment,
                NoteHighlight: body,
                NoteTagList: noteTags[noteUrl],
                NoteTags: joinTags(noteTags[noteUrl]),
                NoteLink: noteLinks[noteUrl],

                PageTitle: pageData.fullTitle,
                PageUrl: pageData.fullUrl,
                PageTags: joinTags(pageTags[pageUrl]),
                PageTagList: pageTags[pageUrl],
                PageLink: pageLinks[pageUrl],

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
        for (const [noteUrl, { body, comment }] of Object.entries(notes)) {
            templateDocs.push({
                NoteText: comment,
                NoteHighlight: body,
                NoteTagList: noteTags[noteUrl],
                NoteTags: joinTags(noteTags[noteUrl]),
                NoteLink: noteLinks[noteUrl],
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
            PageLink: pageLinks[pageUrl],

            title: fullTitle,
            url: fullUrl,
            tags: pageTags[pageUrl],

            Notes: notesByPageUrl[pageUrl].map(
                ({ url: noteUrl, body, comment }) => ({
                    NoteText: comment,
                    NoteHighlight: body,
                    NoteTagList: noteTags[noteUrl],
                    NoteTags: joinTags(noteTags[noteUrl]),
                    NoteLink: noteLinks[noteUrl],

                    PageTitle: fullTitle,
                    PageUrl: fullUrl,
                    PageTags: joinTags(pageTags[pageUrl]),
                    PageTagList: pageTags[pageUrl],
                    PageLink: pageLinks[pageUrl],

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

    return omitEmptyFields(docs)
}
