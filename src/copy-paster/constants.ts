import type {
    TemplateRequirements,
    TemplateDocKey,
    TemplateDocNote,
} from './types'

export const KEYS_TO_REQUIREMENTS: {
    [Key in TemplateDocKey]: keyof TemplateRequirements
} = {
    PageUrl: 'page',
    PageTitle: 'page',
    PageTags: 'pageTags',
    PageTagList: 'pageTags',
    PageSpaces: 'pageSpaces',
    PageSpacesList: 'pageSpaces',
    PageCreatedAt: 'pageCreatedAt',
    PageLink: 'pageLink',

    PageDOI: 'pageMetadata',
    PageMetaTitle: 'pageMetadata',
    PageAnnotation: 'pageMetadata',
    PageSourceName: 'pageMetadata',
    PageJournalName: 'pageMetadata',
    PageJournalPage: 'pageMetadata',
    PageJournalIssue: 'pageMetadata',
    PageJournalVolume: 'pageMetadata',
    PageReleaseDate: 'pageMetadata',
    PageAccessDate: 'pageMetadata',

    EntityName: 'pageEntities',
    EntityAdditionalName: 'pageEntities',
    EntityAdditionalNameShort: 'pageEntities',

    HasNotes: 'hasNotes',
    NoteHighlight: 'note',
    NoteText: 'note',
    NoteTags: 'noteTags',
    NoteTagList: 'noteTags',
    NoteSpaces: 'noteSpaces',
    NoteSpacesList: 'noteSpaces',
    NoteCreatedAt: 'noteCreatedAt',
    NoteLink: 'noteLink',
    url: 'page',
    title: 'page',
    tags: 'pageTags',
}

export const NOTE_KEYS: { [Key in keyof TemplateDocNote]-?: true } = {
    NoteHighlight: true,
    NoteText: true,
    NoteTags: true,
    NoteTagList: true,
    NoteSpaces: true,
    NoteSpacesList: true,
    NoteLink: true,
    NoteCreatedAt: true,
}

export const LEGACY_KEYS = new Set<TemplateDocKey>(['title', 'tags', 'url'])
