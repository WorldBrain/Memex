export interface Template {
    id: number
    title: string
    code: string
    isFavourite: boolean
}

export type TemplateDoc = {
    Notes?: Array<TemplateDocNote>
} & TemplateDocPage &
    TemplateDocNote

export type TemplateDocKey = keyof (TemplateDocPage & TemplateDocNote)

export interface TemplateDocPage {
    PageUrl?: string
    PageTitle?: string
    PageTags?: string
    PageTagList?: string[]
    PageLink?: string

    // For backward compatibility
    url?: string
    title?: string
    tags?: string[]
}

export interface TemplateDocNote {
    NoteHighlight?: string
    NoteText?: string
    NoteTags?: string
    NoteTagList?: string[]
    NoteLink?: string
}

export interface TemplateAnalysis {
    usesLegacyTags: boolean
    noteUsage?: 'single' | 'multiple'
    requirements: TemplateRequirements
}

export interface TemplateRequirements {
    page?: boolean
    pageTags?: boolean
    pageLink?: boolean
    note?: boolean
    noteTags?: boolean
    noteLink?: boolean
}

export interface TemplateDataFetchers {
    getPages(
        normalizedPageUrls: string[],
    ): Promise<{
        [normalizedPageUrl: string]: { fullTitle: string; fullUrl: string }
    }>
    getTagsForPages(
        normalizedPageUrls: string[],
    ): Promise<{ [normalizedPageUrl: string]: string[] }>
    getNotes(
        annotationUrls: string[],
    ): Promise<{ [annotationUrl: string]: { body?: string; comment?: string } }>
    getTagsForNotes(
        annotationUrls: string[],
    ): Promise<{ [annotationUrl: string]: string[] }>
}
