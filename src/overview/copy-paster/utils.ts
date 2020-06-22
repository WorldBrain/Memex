import { Template, TemplateDoc } from './types'
import mustache from 'mustache'

export function renderTemplate(template: Template, doc: TemplateDoc): string {
    return mustache.render(template.code, doc)
}
