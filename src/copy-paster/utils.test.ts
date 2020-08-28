import { analyzeTemplate, renderTemplate } from './utils'
import { KEYS_TO_REQUIREMENTS, LEGACY_KEYS, NOTE_KEYS } from './constants'
import { TemplateDocKey, TemplateAnalysis } from './types'

const testAnalysis = (code: string, expected: TemplateAnalysis) => {
    const analysis = analyzeTemplate({ code })
    expect({ code, analysis }).toEqual({
        code,
        analysis: expected,
    })
}

describe('Content template rendering', () => {
    it('should correctly analyze templates', () => {
        for (const [key, requirement] of Object.entries(KEYS_TO_REQUIREMENTS)) {
            const code = `{{{${key}}}}`
            testAnalysis(code, {
                requirements: expect.objectContaining({
                    [requirement]: true,
                }),
                noteUsage: NOTE_KEYS[key] ? 'single' : undefined,
                usesLegacyTags: LEGACY_KEYS.has(key as TemplateDocKey),
            })
        }
    })

    it('should correctly analyze templates containing loops', () => {
        for (const [key, requirement] of Object.entries(KEYS_TO_REQUIREMENTS)) {
            const code = `{{#Notes}}{{{${key}}}}{{/Notes}}`
            testAnalysis(code, {
                requirements: expect.objectContaining({
                    [requirement]: true,
                }),
                noteUsage: NOTE_KEYS[key] ? 'multiple' : undefined,
                usesLegacyTags: LEGACY_KEYS.has(key as TemplateDocKey),
            })
        }
    })

    it('should correctly detect note usage in a template', () => {
        testAnalysis(`{{{PageTitle}}}`, {
            requirements: {
                page: true,
            },
            usesLegacyTags: false,
        })
        testAnalysis(`{{{NoteText}}}`, {
            requirements: {
                note: true,
            },
            noteUsage: 'single',
            usesLegacyTags: false,
        })
        testAnalysis(`{{#Notes}}{{{NoteText}}}{{/Notes}}`, {
            requirements: {
                note: true,
            },
            noteUsage: 'multiple',
            usesLegacyTags: false,
        })
        testAnalysis(
            `{{{NoteText}}}{{#Notes}}{{{NoteText}}}{{/Notes}}{{{NoteText}}}`,
            {
                requirements: {
                    note: true,
                },
                noteUsage: 'multiple',
                usesLegacyTags: false,
            },
        )
    })
})
