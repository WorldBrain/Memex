import {
    Template,
    TemplateDoc,
    TemplateAnalysis,
    TemplateRequirements,
    TemplateDocKey,
    TemplateDocNote,
    TemplateDataFetchers,
    PageTemplateData,
} from './types'
import mustache from 'mustache'
import { KEYS_TO_REQUIREMENTS, LEGACY_KEYS, NOTE_KEYS } from './constants'

export function renderTemplate(
    template: Pick<Template, 'code'>,
    doc: TemplateDoc,
): string {
    return mustache.render(template.code, doc)
}

export const joinTags = (tags?: string[]): string | undefined =>
    tags == null
        ? undefined
        : tags.reduce(
              (acc, tag, i) =>
                  `${acc}#${tag}${i === tags.length - 1 ? '' : ' '}`,
              '',
          )

export function joinTemplateDocs(
    templateDocs: TemplateDoc[],
    template: Pick<Template, 'code'>,
): string {
    return templateDocs
        .map((templateDoc) => renderTemplate(template, templateDoc))
        .join('\n\n')
}

export function analyzeTemplate(
    template: Pick<Template, 'code'>,
): TemplateAnalysis {
    const templateDoc: TemplateDoc = {}
    for (const key of Object.keys(KEYS_TO_REQUIREMENTS)) {
        templateDoc[key] = `@key%${key}.single@endkey%`
    }

    const note: TemplateDocNote = {}
    for (const key of Object.keys(NOTE_KEYS)) {
        note[key] = `@key%${key}.multiple@endkey%`
    }
    templateDoc['Notes'] = [note]
    const rendered = renderTemplate(template, templateDoc)

    // We don't keep this as a global because it's stateful  :(
    const requirementRegex = /@key%([a-zA-Z\.]+)@endkey%/g

    const requirements: TemplateRequirements = {}
    let usesLegacyTags = false
    let noteUsage: TemplateAnalysis['noteUsage']
    while (true) {
        const match = requirementRegex.exec(rendered)
        if (!match) {
            break
        }

        const identifier = match[1].split('.')
        const key = identifier[0] as TemplateDocKey
        const usage = identifier[1] as TemplateAnalysis['noteUsage']
        if (NOTE_KEYS[key]) {
            // If one multiple usage is there, ignore the single usages
            if (!noteUsage || usage === 'multiple') {
                noteUsage = usage
            }
        }

        const requirement = KEYS_TO_REQUIREMENTS[key]
        requirements[requirement] = true
        usesLegacyTags = usesLegacyTags || LEGACY_KEYS.has(key)
    }

    return { usesLegacyTags, noteUsage, requirements }
}

export async function generateTemplateDocs({
    dataFetchers,
    ...params
}: {
    template: Pick<Template, 'code'>
    normalizedPageUrls: string[]
    annotationUrls: string[]
    dataFetchers: TemplateDataFetchers
}): Promise<TemplateDoc[]> {
    const templateAnalysis = analyzeTemplate(params.template)

    if (!params.annotationUrls.length) {
        const pageData = await dataFetchers.getPages(params.normalizedPageUrls)
        const pageTagData = await dataFetchers.getTagsForPages(
            params.normalizedPageUrls,
        )

        let pageLinks = {}
        if (templateAnalysis.requirements.pageLink) {
            pageLinks = await dataFetchers.getPageLinks(
                params.normalizedPageUrls,
            )
        }

        // user clicked on copy page
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

    if (params.annotationUrls.length >= 1) {
        const notes = await dataFetchers.getNotes(params.annotationUrls)
        let noteTags = {}
        let noteLinks = {}
        let pageData: PageTemplateData = {} as PageTemplateData
        let pageTagData: string[]
        let pageLink: string

        if (templateAnalysis.requirements.noteTags) {
            noteTags = await dataFetchers.getTagsForNotes(params.annotationUrls)
        }

        if (templateAnalysis.requirements.page) {
            // There will only ever be a single page
            const pages = await dataFetchers.getPages(params.normalizedPageUrls)
            pageData = Object.values(pages)?.[0] ?? ({} as PageTemplateData)
        }

        if (templateAnalysis.requirements.pageTags) {
            // There will only ever be a single page
            const pageTags = await dataFetchers.getTagsForPages(
                params.normalizedPageUrls,
            )
            pageTagData = Object.values(pageTags)?.[0]
        }

        if (templateAnalysis.requirements.pageLink) {
            // There will only ever be a single page
            const pageLinks = await dataFetchers.getPageLinks(
                params.normalizedPageUrls,
            )
            pageLink = Object.values(pageLinks)?.[0]
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
    return [{}]
}
