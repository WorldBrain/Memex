import {
    TemplateDoc,
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
    PageLink: 'pageLink',
    NoteHighlight: 'note',
    NoteText: 'note',
    NoteTags: 'noteTags',
    NoteTagList: 'noteTags',
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
    NoteLink: true,
}

export const LEGACY_KEYS = new Set<TemplateDocKey>(['title', 'tags', 'url'])
