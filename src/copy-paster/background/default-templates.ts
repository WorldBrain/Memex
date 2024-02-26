import { Storage } from 'webextension-polyfill'

import { Template } from '../types'
import CopyPasterBackground from '.'
import { ImageSupportInterface } from 'src/image-support/background/types'
import { DEFAULT_SPACE_BETWEEN } from '@worldbrain/memex-common/lib/utils/item-ordering'

export const PERFORMED_STORAGE_FLAG = '@TextExport-default_templates_inserted_1'

export const JUST_URL: Template = {
    id: 1,
    title: 'Page URL',
    isFavourite: false,
    order: DEFAULT_SPACE_BETWEEN * 1,
    outputFormat: 'markdown',
    code: `{{{PageUrl}}}`,
}

export const URL_AND_TITLE: Template = {
    id: 2,
    title: 'Page URL & Title',
    isFavourite: false,
    order: DEFAULT_SPACE_BETWEEN * 2,
    outputFormat: 'markdown',
    code: `{{{PageTitle}}}
{{{PageUrl}}}`,
}

export const ROAM_MD_TEMPLATE: Template = {
    id: 3,
    title: 'Roam Template',
    isFavourite: false,
    order: DEFAULT_SPACE_BETWEEN * 3,
    outputFormat: 'rich-text',
    code: `[[{{{PageTitle}}}]]
 - url:: {{{PageUrl}}} 
{{#PageSpaces}}  
 - Spaces:: {{{PageSpaces}}} 
{{/PageSpaces}} 
{{#HasNotes}}
  - Annotations::
{{#Notes}}
{{#NoteHighlight}}
    - "{{{NoteHighlight}}}"
{{/NoteHighlight}} 
{{#NoteText}}
      - {{{NoteText}}}
{{/NoteText}} 
{{#NoteSpaces}}
      - Spaces: {{{NoteSpaces}}} 
{{/NoteSpaces}} 
{{/Notes}} 
{{/HasNotes}} 
`,
}

export const TANA_PASTE_TEMPLATE: Template = {
    id: 4,
    title: 'Tana Paste Template',
    isFavourite: false,
    order: DEFAULT_SPACE_BETWEEN * 4,
    outputFormat: 'markdown',
    code: `%%tana%% 
- {{{PageTitle}}}
{{#PageSpaces}}  
    - Spaces: {{{PageSpaces}}} 
{{/PageSpaces}} 
    - url: {{{PageUrl}}}  - 
{{#HasNotes}} 
    - Annotations:
{{#Notes}}
        - Note {{#NoteSpaces}}for {{{NoteSpaces}}}{{/NoteSpaces}}
{{#NoteHighlight}}  
            - "{{{NoteHighlight}}}"
    {{/NoteHighlight}} 
{{#NoteText}}
            - {{{NoteText}}}
    {{/NoteText}} 
{{/Notes}} 
{{/HasNotes}}
`,
}
export const NOTION_MD_TEMPLATE: Template = {
    id: 5,
    title: 'Notion Template',
    isFavourite: false,
    order: DEFAULT_SPACE_BETWEEN * 5,
    outputFormat: 'markdown',
    code: ` 
[{{{PageTitle}}}]({{{PageUrl}}})
{{#PageSpaces}}  
  - Spaces: {{{PageSpaces}}} 
{{/PageSpaces}} 
{{#HasNotes}} 
  - Annotations:
{{#Notes}}
{{#NoteHighlight}}  
    - "{{{NoteHighlight}}}"
{{/NoteHighlight}} 
{{#NoteText}}
      - {{{NoteText}}}
    {{/NoteText}} 
{{#NoteSpaces}}  
      - Spaces: {{{NoteSpaces}}} 
{{/NoteSpaces}} 
{{/Notes}} 
{{/HasNotes}}
`,
}
export const OBSIDIAN_MD_TEMPLATE: Template = {
    id: 6,
    title: 'Obsidian Template',
    isFavourite: false,
    order: DEFAULT_SPACE_BETWEEN * 6,
    outputFormat: 'rich-text',
    code: ` 
- [[{{{PageTitle}}}]]
    - url: {{{PageUrl}}} 
{{#PageSpaces}}  
    - Spaces: {{{PageSpaces}}} 
{{/PageSpaces}} 
{{#HasNotes}}
    - Annotations:
{{#Notes}}
{{#NoteHighlight}}
        - "{{{NoteHighlight}}}"
{{/NoteHighlight}} 
{{#NoteText}}
            - {{{NoteText}}}
{{/NoteText}} 
{{#NoteSpaces}}
            - Spaces: {{{NoteSpaces}}} 
{{/NoteSpaces}} 
{{/Notes}} 
{{/HasNotes}} 
`,
}
export const LOGSEQ_MD_TEMPLATE: Template = {
    id: 7,
    title: 'Logseq Template',
    isFavourite: false,
    order: DEFAULT_SPACE_BETWEEN * 7,
    outputFormat: 'markdown',
    code: `[[{{{PageTitle}}}]]
 - url:: {{{PageUrl}}} 
{{#PageSpaces}}  
 - Spaces:: {{{PageSpaces}}} 
{{/PageSpaces}} 
{{#HasNotes}}
  - Annotations::
{{#Notes}}
{{#NoteHighlight}}
    - "{{{NoteHighlight}}}"
{{/NoteHighlight}} 
{{#NoteText}}
      - {{{NoteText}}}
{{/NoteText}} 
{{#NoteSpaces}}
      - Spaces: {{{NoteSpaces}}} 
{{/NoteSpaces}} 
{{/Notes}} 
{{/HasNotes}} 
`,
}

export const HTML_TEMPLATE: Template = {
    id: 8,
    title: 'HTML',
    isFavourite: false,
    order: DEFAULT_SPACE_BETWEEN * 8,
    outputFormat: 'markdown',
    code: `<a target="_blank"  href="{{{PageUrl}}}">{{{PageTitle}}}</a>
<ul>
{{#Notes}}
<li>
<p style="font-style: italic">
"{{{NoteHighlight}}}"
</p>
<p>
{{{NoteText}}}
</p>
</li>
{{/Notes}}
</ul>
`,
}

const DEFAULT_TEMPLATES = [
    HTML_TEMPLATE,
    ROAM_MD_TEMPLATE,
    LOGSEQ_MD_TEMPLATE,
    NOTION_MD_TEMPLATE,
    OBSIDIAN_MD_TEMPLATE,
    TANA_PASTE_TEMPLATE,
    JUST_URL,
    URL_AND_TITLE,
]

export default async function insertDefaultTemplates({
    copyPaster,
    localStorage,
    templates = DEFAULT_TEMPLATES,
}: {
    copyPaster: CopyPasterBackground
    localStorage: Storage.LocalStorageArea
    templates?: Template[]
    imageSupport?: ImageSupportInterface<'caller'>
}) {
    const alreadyPerformed = (await localStorage.get(PERFORMED_STORAGE_FLAG))[
        PERFORMED_STORAGE_FLAG
    ]

    if (alreadyPerformed) {
        return
    }

    for (const template of templates) {
        await copyPaster.storage.__createTemplateWithId(template)
    }

    await localStorage.set({ [PERFORMED_STORAGE_FLAG]: true })
}
