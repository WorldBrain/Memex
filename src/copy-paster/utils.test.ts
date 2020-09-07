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

describe('Content template analysis', () => {
    it('should correctly analyze templates', () => {
        for (const [key, requirement] of Object.entries(KEYS_TO_REQUIREMENTS)) {
            const code = `{{{${key}}}}`
            testAnalysis(code, {
                requirements: {
                    [requirement]: true,
                },
                noteUsage: NOTE_KEYS[key] ? 'single' : undefined,
                usesLegacyTags: LEGACY_KEYS.has(key as TemplateDocKey),
            })
        }
    })

    it('should correctly analyze templates containing loops', () => {
        for (const [key, requirement] of Object.entries(KEYS_TO_REQUIREMENTS)) {
            const code = `{{#Notes}}{{{${key}}}}{{/Notes}}`
            testAnalysis(code, {
                requirements: {
                    [requirement]: true,
                },
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

describe('Content template rendering', () => {
    it('should strip whitespace from all text fields', () => {
        expect(
            renderTemplate(
                {
                    code: [
                        `{{PageTitle}}`,
                        `{{NoteText}}`,
                        `{{#Notes}}{{NoteText}}{{/Notes}}`,
                        `{{#Pages}}{{PageTitle}}{{/Pages}}`,
                    ].join(' '),
                },
                {
                    PageTitle: '  test1  ',
                    NoteText: ' test2 ',
                    Notes: [{ NoteText: '  test3  ' }],
                    Pages: [{ PageTitle: '  test4  ' }],
                },
            ),
        ).toEqual('test1 test2 test3 test4')
    })

    it('should preserve indentation when rendering multi-line values', () => {
        expect(
            renderTemplate(
                {
                    code: ' {{NoteHighlight}}\n  {{NoteText}}\n{{NoteLink}}',
                },
                {
                    NoteHighlight: 'test1\r\ntest2\ntest3',
                    NoteText: 'test4\ntest5\ntest6',
                    NoteLink: 'test7',
                },
            ),
        ).toEqual(` test1\n test2\n test3\n  test4\n  test5\n  test6\ntest7`)
    })
})
