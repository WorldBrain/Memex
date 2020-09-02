import { joinTags, analyzeTemplate } from './utils'
import {
    TemplateDataFetchers,
    PageTemplateData,
    TemplateDoc,
    Template,
} from './types'

interface GeneratorInput {
    template: Pick<Template, 'code'>
    normalizedPageUrls: string[]
    annotationUrls: string[]
    dataFetchers: TemplateDataFetchers
}

const getFirstPageData = <T>(data: { [url: string]: T }): T | undefined =>
    Object.values(data)?.[0]

const omitUndefinedFields = (docs: TemplateDoc[]): TemplateDoc[] =>
    docs.map((doc) => {
        if (doc.Notes) {
            doc.Notes = doc.Notes.map(omitUndefined)
        }
        if (doc.Pages) {
            doc.Pages = doc.Pages.map(omitUndefined)
        }
        return omitUndefined(doc)
    })

const omitUndefined = <T>(obj: T): T => {
    const clone = { ...obj }
    for (const key in clone) {
        if (clone[key] == null) {
            delete clone[key]
        }
    }
    return clone
}

// Should work for single and multiple pages, but only for top-level page variables
//   i.e., usage of `Pages` array var not yet supported
const generateForPages = async ({
    dataFetchers,
    ...params
}: GeneratorInput): Promise<TemplateDoc[]> => {
    const templateAnalysis = analyzeTemplate(params.template)
    const pageData = await dataFetchers.getPages(params.normalizedPageUrls)
    const pageTagData = await dataFetchers.getTagsForPages(
        params.normalizedPageUrls,
    )

    let pageLinks = {}
    if (templateAnalysis.requirements.pageLink) {
        pageLinks = await dataFetchers.getPageLinks(params.normalizedPageUrls)
    }

    const templateDocs: TemplateDoc[] = Object.entries(pageData).map(
        ([normalizedPageUrl, { fullTitle, fullUrl }]) => {
            const pageTags = pageTagData[normalizedPageUrl] ?? []

            return {
                PageTitle: fullTitle,
                PageTags: joinTags(pageTags),
                PageTagList: pageTags,
                PageUrl: fullUrl,
                PageLink: pageLinks[normalizedPageUrl],

                title: fullTitle,
                tags: pageTags,
                url: fullUrl,
            }
        },
    )

    return templateDocs
}

const generateForNotes = async ({
    dataFetchers,
    ...params
}: GeneratorInput): Promise<TemplateDoc[]> => {
    const templateAnalysis = analyzeTemplate(params.template)

    const notes = await dataFetchers.getNotes(params.annotationUrls)
    let noteTags = {}
    let noteLinks = {}
    let pageData: PageTemplateData = {} as PageTemplateData
    let pageTagData: string[]
    let pageLink: string

    if (templateAnalysis.requirements.page) {
        // There will only ever be a single page
        const pages = await dataFetchers.getPages(params.normalizedPageUrls)
        pageData = getFirstPageData(pages) ?? ({} as PageTemplateData)
    }

    if (templateAnalysis.requirements.pageTags) {
        // There will only ever be a single page
        const pageTags = await dataFetchers.getTagsForPages(
            params.normalizedPageUrls,
        )
        pageTagData = getFirstPageData(pageTags)
    }

    if (templateAnalysis.requirements.noteTags) {
        noteTags = await dataFetchers.getTagsForNotes(params.annotationUrls)
    }

    if (templateAnalysis.requirements.pageLink) {
        // There will only ever be a single page
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

export async function generateTemplateDocs(
    params: GeneratorInput,
): Promise<TemplateDoc[]> {
    let docs: TemplateDoc[] = []

    if (!params.annotationUrls.length) {
        docs = await generateForPages(params)
    } else if (params.annotationUrls.length >= 1) {
        docs = await generateForNotes(params)
    }

    return omitUndefinedFields(docs)
}
