export interface Template {
    id: number
    title: string
    code: string
    isFavourite: boolean
}

export type TemplateDoc = {
    Notes?: Array<TemplateDocNote>
    Pages?: Array<TemplateDocPage>
} & TemplateDocPage &
    TemplateDocNote

export type TemplateDocKey = keyof (Omit<TemplateDocPage, 'Notes'> &
    TemplateDocNote)

export interface TemplateDocPage {
    PageUrl?: string
    PageTitle?: string
    PageTags?: string
    PageTagList?: string[]
    PageSpaces?: string
    PageSpaceList?: string[]
    PageLink?: string
    Notes?: TemplateDocNote[]

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
    NoteSpaces?: string
    NoteSpaceList?: string[]
    NoteLink?: string
}

export interface TemplateAnalysis {
    usesLegacyTags: boolean
    expectedContext: 'note' | 'page' | 'page-list'
    requirements: TemplateRequirements
}

export interface TemplateRequirements {
    page?: boolean
    pageTags?: boolean
    pageSpaces?: boolean
    pageLink?: boolean
    note?: boolean
    noteTags?: boolean
    noteSpaces?: boolean
    noteLink?: boolean
}

export interface TemplateDataFetchers {
    getPages(
        normalizedPageUrls: string[],
    ): Promise<{ [normalizedPageUrl: string]: PageTemplateData }>
    getNotes(
        annotationUrls: string[],
    ): Promise<{ [annotationUrl: string]: NoteTemplateData }>
    getNoteIdsForPages(
        normalizedPageUrls: string[],
    ): Promise<{ [normalizedPageUrl: string]: string[] }>
    getTagsForNotes(
        annotationUrls: string[],
    ): Promise<{ [annotationUrl: string]: string[] }>
    getTagsForPages(
        normalizedPageUrls: string[],
    ): Promise<{ [normalizedPageUrl: string]: string[] }>
    getSpacesForNotes(
        annotationUrls: string[],
    ): Promise<{ [annotationUrl: string]: string[] }>
    getSpacesForPages(
        normalizedPageUrls: string[],
    ): Promise<{ [normalizedPageUrl: string]: string[] }>
    getPageLinks(notes: {
        [normalizedPageUrl: string]: { annotationUrls: string[] }
    }): Promise<{ [normalizedPageUrl: string]: string }>
    getNoteLinks(
        annotationUrls: string[],
    ): Promise<{ [annotationUrl: string]: string }>
}

export interface PageTemplateData {
    fullUrl: string
    fullTitle: string
}

export interface NoteTemplateData {
    url: string
    pageUrl: string
    body?: string
    comment?: string
}

export interface UrlMappedData<T> {
    [url: string]: T
}
