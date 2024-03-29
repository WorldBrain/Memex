import type {
    PageEntity,
    PageMetadata,
} from '@worldbrain/memex-common/lib/types/core-data-types/client'

export interface Template {
    id: number
    title: string
    code: string
    order: number
    isFavourite: boolean
    outputFormat?: 'markdown' | 'rich-text'
}

export type TemplateDoc = {
    Pages?: Array<TemplateDocPage>
} & TemplateDocPage &
    TemplateDocNote &
    TemplateDocPageEntity

export type TemplateDocKey = keyof (Omit<
    TemplateDocPage,
    'Notes' | 'PageEntities'
> &
    TemplateDocNote &
    TemplateDocPageEntity)

export interface TemplateDocPage {
    PageUrl?: string
    PageTitle?: string
    PageTags?: string
    PageTagList?: string[]
    PageSpaces?: string
    PageSpacesList?: string[]
    PageCreatedAt?: number

    PageDOI?: string
    PageMetaTitle?: string
    PageAnnotation?: string
    PageSourceName?: string
    PageJournalName?: string
    PageJournalPage?: string
    PageJournalIssue?: string
    PageJournalVolume?: string
    PageReleaseDate?: number
    PageAccessDate?: number
    PageEntities?: TemplateDocPageEntity[]

    HasNotes?: boolean
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
    NoteSpacesList?: string[]
    NoteCreatedAt?: number
    NoteLink?: string
}

export interface TemplateDocPageEntity {
    EntityName?: string
    EntityAdditionalName?: string
    EntityAdditionalNameShort?: string
    secondLast?: boolean
    isPrimary?: boolean
    showEtAl?: boolean
    last?: boolean
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
    pageMetadata?: boolean
    pageEntities?: boolean
    pageCreatedAt?: boolean
    hasNotes?: boolean
    pageLink?: boolean
    note?: boolean
    noteTags?: boolean
    noteSpaces?: boolean
    noteCreatedAt?: boolean
    noteLink?: boolean
}

export interface TemplateDataFetchers {
    getPages(
        normalizedPageUrls: string[],
    ): Promise<UrlMappedData<PageTemplateData>>
    getNotes(annotationUrls: string[]): Promise<UrlMappedData<NoteTemplateData>>
    getNoteIdsForPages(
        normalizedPageUrls: string[],
    ): Promise<UrlMappedData<string[]>>
    getTagsForNotes(annotationUrls: string[]): Promise<UrlMappedData<string[]>>
    getTagsForPages(
        normalizedPageUrls: string[],
    ): Promise<UrlMappedData<string[]>>
    getSpacesForNotes(
        annotationUrls: string[],
    ): Promise<UrlMappedData<string[]>>
    getSpacesForPages(
        normalizedPageUrls: string[],
    ): Promise<UrlMappedData<string[]>>
    getMetadataForPages(
        normalizedPageUrls: string[],
    ): Promise<UrlMappedData<PageMetadata>>
    getEntitiesForPages(
        normalizedPageUrls: string[],
    ): Promise<UrlMappedData<PageEntity[]>>
    getCreatedAtForPages(
        normalizedPageUrls: string[],
    ): Promise<UrlMappedData<Date>>
    getPageLinks(
        notes: UrlMappedData<{ annotationUrls: string[] }>,
        now?: number,
    ): Promise<UrlMappedData<string>>
    getNoteLinks(annotationUrls: string[]): Promise<UrlMappedData<string>>
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
    createdAt: Date
}

export interface UrlMappedData<T> {
    [url: string]: T
}
