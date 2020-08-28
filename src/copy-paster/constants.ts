import { TemplateDoc, TemplateRequirements } from './types'

export const KEYS_TO_REQUIREMENTS: {
    [Key in keyof TemplateDoc]: keyof TemplateRequirements
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

export const LEGACY_KEYS = new Set<keyof TemplateDoc>(['title', 'tags', 'url'])
