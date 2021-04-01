import traverse from 'traverse'
import mustache from 'mustache'
import {
    Template,
    TemplateDoc,
    TemplateAnalysis,
    TemplateRequirements,
    TemplateDocKey,
    TemplateDocNote,
} from './types'
import { KEYS_TO_REQUIREMENTS, LEGACY_KEYS, NOTE_KEYS } from './constants'

export function renderTemplate(
    template: Pick<Template, 'code'>,
    doc: TemplateDoc,
): string {
    traverse(doc).forEach(function (value) {
        if (typeof value === 'string') {
            this.update(
                `@startvalue%${value
                    .trim()
                    .replace(/<br\s*\/?>/g, '\n')}@endvalue%`,
            )
        }
    })

    const rendered = mustache
        .render(template.code, {
            ...doc,
            literal: () => (text: string) => text,
        })
        .replace('\r\n', '\n')

    // Since the String.replace value doesn't correctly pass in the string *after*
    // each replacement (even though that's supposed to be the last param passed in)
    // we have to manually keep trying to replace, until nothing has been replaced.
    let processed = rendered
    while (true) {
        const regex = /@startvalue%([\s\S]+?)@endvalue%/g

        // Sadly there's no way to do only one replacement with the /g option,
        // so we manually keep track of whether we already replaced something
        let replaced = false
        processed = processed.replace(
            regex,
            (wholeMatch, value, offset: number) => {
                if (replaced) {
                    return wholeMatch
                }
                replaced = true

                const newlineIndexBeforeValue = processed.lastIndexOf(
                    '\n',
                    offset,
                )
                let lastSpaceIndexBeforeValue = processed.lastIndexOf(
                    ' ',
                    offset,
                )
                if (lastSpaceIndexBeforeValue < newlineIndexBeforeValue) {
                    lastSpaceIndexBeforeValue = offset - 1
                }
                const textBeforeValue = processed.substring(
                    newlineIndexBeforeValue > 0
                        ? newlineIndexBeforeValue + 1
                        : 0,
                    lastSpaceIndexBeforeValue > 0
                        ? lastSpaceIndexBeforeValue + 1
                        : offset,
                )
                const whitespace = textBeforeValue.replace(/\S/, ' ')
                return value.replace(/\n/g, `\n${whitespace}`)
            },
        )

        if (!replaced) {
            break
        }
    }

    return processed
}

export function joinTemplateDocs(
    templateDocs: TemplateDoc[],
    template: Pick<Template, 'code'>,
): string {
    return templateDocs
        .map((templateDoc) => renderTemplate(template, templateDoc))
        .join('\n')
}

export function analyzeTemplate(
    template: Pick<Template, 'code'>,
): TemplateAnalysis {
    const templateDoc: TemplateDoc = { Pages: [{}], Notes: [{}] }
    for (const key of Object.keys(KEYS_TO_REQUIREMENTS)) {
        templateDoc[key] = `@key%${key}.note@endkey%`
        templateDoc.Pages[0][key] = `@key%${key}.page-list@endkey%`
        templateDoc.Notes[0][key] = `@key%${key}.page@endkey%`
    }
    const rendered = renderTemplate(template, templateDoc)

    // We don't keep this as a global because it's stateful  :(
    const requirementRegex = /@key%([a-zA-Z\.\-]+)@endkey%/g

    const requirements: TemplateRequirements = {}
    let usesLegacyTags = false
    let expectedContext: TemplateAnalysis['expectedContext']
    while (true) {
        const match = requirementRegex.exec(rendered)
        if (!match) {
            break
        }

        const identifier = match[1].split('.')
        const key = identifier[0] as TemplateDocKey
        const usage = identifier[1] as TemplateAnalysis['expectedContext']
        if (usage === 'page-list') {
            expectedContext = 'page-list'
        } else if (expectedContext !== 'page-list' && NOTE_KEYS[key]) {
            // If one note list usage is there, ignore the single usages
            if (!expectedContext || usage === 'page') {
                expectedContext = usage
            }
        }

        const requirement = KEYS_TO_REQUIREMENTS[key]
        requirements[requirement] = true
        usesLegacyTags = usesLegacyTags || LEGACY_KEYS.has(key)
    }
    if (!expectedContext) {
        expectedContext = 'page'
    }

    return { usesLegacyTags, expectedContext, requirements }
}
