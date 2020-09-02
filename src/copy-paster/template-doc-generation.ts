import {
    TemplateDataFetchers,
    PageTemplateData,
    TemplateDoc,
    NoteTemplateData,
    TemplateAnalysis,
} from './types'

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

/**
 * Exists as a helper as often we're dealing with arrays of page data where there will only ever be
 * a single entry. e.g. the single parent page of a note.
 */
const getFirstPageData = <T>(data: { [url: string]: T }): T | undefined =>
    Object.values(data)?.[0]

const omitEmptyFields = (docs: TemplateDoc[]): TemplateDoc[] =>
    docs.map((doc) => {
        if (doc.Notes) {
            doc.Notes = doc.Notes.map(omitEmpty)
        }
        if (doc.Pages) {
            doc.Pages = doc.Pages.map(omitEmpty)
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

// Should work for single and multiple pages, but only for top-level page variables
//   i.e., usage of `Pages` array var not yet supported
const generateForPages = async ({
    templateAnalysis,
    dataFetchers,
    ...params
}: GeneratorInput): Promise<TemplateDoc[]> => {
    const pageData = await dataFetchers.getPages(params.normalizedPageUrls)

    let noteLinks: UrlMappedData<string> = {}
    let pageLinks: UrlMappedData<string> = {}
    let pageTags: UrlMappedData<string[]> = {}
    let noteTags: UrlMappedData<string[]> = {}
    let notes: UrlMappedData<NoteTemplateData> = {}
    let noteUrlsForPages: UrlMappedData<string[]> = {}

    if (templateAnalysis.requirements.pageTags) {
        pageTags = await dataFetchers.getTagsForPages(params.normalizedPageUrls)
    }

    if (templateAnalysis.requirements.pageLink) {
        pageLinks = await dataFetchers.getPageLinks(params.normalizedPageUrls)
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

        templateDocs.push({
            PageTitle: fullTitle,
            PageTags: joinTags(tags),
            PageTagList: tags,
            PageUrl: fullUrl,
            PageLink: pageLinks[normalizedPageUrl],

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

    return templateDocs
}

const generateForNotes = async ({
    templateAnalysis,
    dataFetchers,
    ...params
}: GeneratorInput): Promise<TemplateDoc[]> => {
    const notes = await dataFetchers.getNotes(params.annotationUrls)
    let noteTags: UrlMappedData<string[]> = {}
    let noteLinks: UrlMappedData<string> = {}
    let pageData: PageTemplateData = {} as PageTemplateData
    let pageTagData: string[]
    let pageLink: string

    if (templateAnalysis.requirements.page) {
        const pages = await dataFetchers.getPages(params.normalizedPageUrls)
        pageData = getFirstPageData(pages) ?? ({} as PageTemplateData)
    }

    if (templateAnalysis.requirements.pageTags) {
        const pageTags = await dataFetchers.getTagsForPages(
            params.normalizedPageUrls,
        )
        pageTagData = getFirstPageData(pageTags)
    }

    if (templateAnalysis.requirements.noteTags) {
        noteTags = await dataFetchers.getTagsForNotes(params.annotationUrls)
    }

    if (templateAnalysis.requirements.pageLink) {
        const pageLinks = await dataFetchers.getPageLinks(
            params.normalizedPageUrls,
        )
        pageLink = getFirstPageData(pageLinks)
    }

    if (templateAnalysis.requirements.noteLink) {
        noteLinks = await dataFetchers.getNoteLinks(params.annotationUrls)
    }

    // user clicked to copy multiple/all annotations on page
    // but they only want to render page info, so no need to fetch annotations
    if (!templateAnalysis.noteUsage) {
        return [
            {
                PageTitle: pageData.fullTitle,
                PageTags: joinTags(pageTagData),
                PageTagList: pageTagData,
                PageUrl: pageData.fullUrl,
                PageLink: pageLink,

                title: pageData.fullTitle,
                tags: pageTagData,
                url: pageData.fullUrl,
            },
        ]
    }

    if (templateAnalysis.noteUsage === 'single') {
        // but they are using the top-level data (NoteText, etc.) so return
        // multiple TemplatePageDocs that will later be rendered and joined together
        const templateDocs: TemplateDoc[] = []

        for (const [noteUrl, { body, comment }] of Object.entries(notes)) {
            templateDocs.push({
                NoteText: comment,
                NoteHighlight: body,
                NoteTagList: noteTags[noteUrl],
                NoteTags: joinTags(noteTags[noteUrl]),
                NoteLink: noteLinks[noteUrl],

                PageTitle: pageData.fullTitle,
                PageUrl: pageData.fullUrl,
                PageTags: joinTags(pageTagData),
                PageTagList: pageTagData,
                PageLink: pageLink,

                title: pageData.fullTitle,
                url: pageData.fullUrl,
                tags: pageTagData,
            })
        }

        return templateDocs
    }

    if (templateAnalysis.noteUsage === 'multiple') {
        // they're iterating through the Notes array, so we only need to generate a single TemplatePageDoc
        const noteTemplates = []
        for (const [noteUrl, { body, comment }] of Object.entries(notes)) {
            noteTemplates.push({
                NoteText: comment,
                NoteHighlight: body,
                NoteTagList: noteTags[noteUrl],
                NoteTags: joinTags(noteTags[noteUrl]),
                NoteLink: noteLinks[noteUrl],

                PageTitle: pageData.fullTitle,
                PageUrl: pageData.fullUrl,
                PageTags: joinTags(pageTagData),
                PageTagList: pageTagData,
                PageLink: pageLink,

                title: pageData.fullTitle,
                url: pageData.fullUrl,
                tags: pageTagData,
            })
        }

        return [
            {
                Notes: noteTemplates,
                PageTitle: pageData.fullTitle,
                PageUrl: pageData.fullUrl,
                PageTags: joinTags(pageTagData),
                PageTagList: pageTagData,
                PageLink: pageLink,

                title: pageData.fullTitle,
                url: pageData.fullUrl,
                tags: pageTagData,
            },
        ]
    }
}

export default async function generateTemplateDocs(
    params: GeneratorInput,
): Promise<TemplateDoc[]> {
    let docs: TemplateDoc[] = []

    if (!params.annotationUrls.length) {
        docs = await generateForPages(params)
    } else if (params.annotationUrls.length >= 1) {
        docs = await generateForNotes(params)
    }

    return omitEmptyFields(docs)
}
