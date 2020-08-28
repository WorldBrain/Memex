export interface Template {
    id: number
    title: string
    code: string
    isFavourite: boolean
}

export interface TemplateDoc {
    PageUrl?: string
    PageTitle?: string
    PageTags?: string
    PageTagList?: string
    PageLink?: string
    NoteHighlight?: string
    NoteText?: string
    NoteTags?: string
    NoteTagList?: string
    NoteLink?: string

    // For backward compatibility
    url?: string
    title?: string
    tags?: string[]
}

export interface TemplateAnalysis {
    usesLegacyTags: boolean
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
