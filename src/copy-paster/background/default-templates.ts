import { Template } from '../types'
import CopyPasterBackground from '.'

export const ROAM_MD_TEMPLATE: Template = {
    id: 1,
    title: 'Roam Markdown',
    isFavourite: false,
    code: `
[[{{{PageTitle}}}]]
{{#Notes}}
  ^^{{{NoteHighlight}}}^^ ([Link]({{{NoteLink}}})) {{{NoteTags}}}
    {{{NoteText}}}
{{/Notes}}
`,
}

export const NOTION_MD_TEMPLATE: Template = {
    id: 2,
    title: 'Notion Markdown',
    isFavourite: false,
    code: `
[{{{PageTitle}}}]({{{PageLink}}})
{{#Notes}}
- [{{{NoteHighlight}}}]({{{NoteLink}}})^^ {{{NoteTags}}}
  {{{NoteText}}}
{{/Notes}}
`,
}

export const HTML_TEMPLATE: Template = {
    id: 3,
    title: 'HTML',
    isFavourite: false,
    code: `
<a target="_blank"  href="{{{PageLink}}}">{{{PageTitle}}}</a>
<ul>
{{#Notes}}
<li>
<a target="_blank" href="{{{NoteLink}}}">
<p style="font-style: italic">
"{{{NoteHighlight}}}"
</p>
</a>
<p>
{{{NoteText}}}
</p>
</li>
{{/Notes}}
</ul>
`,
}

const DEFAULT_TEMPLATES = [HTML_TEMPLATE, ROAM_MD_TEMPLATE, NOTION_MD_TEMPLATE]

export default async function insertDefaultTemplates({
    copyPaster,
    templates = DEFAULT_TEMPLATES,
}: {
    copyPaster: CopyPasterBackground
    templates?: Template[]
}) {
    for (const template of templates) {
        if (await copyPaster.findTemplate(template)) {
            break
        }

        await copyPaster.storage.__createTemplateWithId(template)
    }
}
