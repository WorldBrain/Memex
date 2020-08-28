import {
    Template,
    TemplateDoc,
    TemplateAnalysis,
    TemplateRequirements,
} from './types'
import mustache from 'mustache'
import { KEYS_TO_REQUIREMENTS, LEGACY_KEYS } from './constants'

export function renderTemplate(
    template: Pick<Template, 'code'>,
    doc: TemplateDoc,
): string {
    return mustache.render(template.code, doc)
}

export function analyzeTemplate(
    template: Pick<Template, 'code'>,
): TemplateAnalysis {
    const templateDoc: TemplateDoc = {}
    for (const key of Object.keys(KEYS_TO_REQUIREMENTS)) {
        templateDoc[key] = `@key%${key}@endkey%`
    }
    const rendered = renderTemplate(template, templateDoc)

    // We don't keep this as a global because it's stateful  :(
    const requirementRegex = /@key%([a-zA-Z]+)@endkey%/g

    const requirements: TemplateRequirements = {}
    let usesLegacyTags = false
    while (true) {
        const match = requirementRegex.exec(rendered)
        if (!match) {
            break
        }

        const key = match[1] as keyof TemplateDoc
        const requirement = KEYS_TO_REQUIREMENTS[key]
        requirements[requirement] = true
        usesLegacyTags = usesLegacyTags || LEGACY_KEYS.has(key)
    }

    return { usesLegacyTags, requirements }
}
