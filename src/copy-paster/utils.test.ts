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
                expectedContext: NOTE_KEYS[key] ? 'note' : 'page',
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
                expectedContext: NOTE_KEYS[key] ? 'page' : 'page',
                usesLegacyTags: LEGACY_KEYS.has(key as TemplateDocKey),
            })
        }
    })

    it('should correctly detect expected context in a template', () => {
        testAnalysis(`{{{PageTitle}}}`, {
            requirements: {
                page: true,
            },
            expectedContext: 'page',
            usesLegacyTags: false,
        })
        testAnalysis(`{{{NoteText}}}`, {
            requirements: {
                note: true,
            },
            expectedContext: 'note',
            usesLegacyTags: false,
        })
        testAnalysis(`{{#Notes}}{{{NoteText}}}{{/Notes}}`, {
            requirements: {
                note: true,
            },
            expectedContext: 'page',
            usesLegacyTags: false,
        })
        testAnalysis(
            `{{{NoteText}}}{{#Notes}}{{{NoteText}}}{{/Notes}}{{{NoteText}}}`,
            {
                requirements: {
                    note: true,
                },
                expectedContext: 'page',
                usesLegacyTags: false,
            },
        )
        testAnalysis(
            `{{#Pages}}{{PageTitle}}{{#Notes}}{{NoteText}}{{/Notes}}{{/Pages}}`,
            {
                requirements: {
                    note: true,
                    page: true,
                },
                expectedContext: 'page-list',
                usesLegacyTags: false,
            },
        )
        testAnalysis(
            `{{#Pages}}{{PageTitle}}{{#Notes}}{{NoteText}}{{/Notes}}{{/Pages}}{{#Notes}}{{NoteText}}{{/Notes}}`,
            {
                requirements: {
                    note: true,
                    page: true,
                },
                expectedContext: 'page-list',
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

    describe('should preserve indentation when rendering multi-line values', () => {
        function indentTest(
            description: string,
            config: {
                code: string
                highlight: string
                text?: string
                link?: string
                expected: string
            },
        ) {
            it(description, () => {
                expect(
                    renderTemplate(
                        {
                            code: config.code,
                        },
                        {
                            NoteHighlight: config.highlight,
                            NoteText: config.text,
                            NoteLink: config.link,
                        },
                    ),
                ).toEqual(config.expected)
            })
        }

        indentTest('should work with UNIX linebreaks', {
            code: '  {{{NoteHighlight}}}',
            highlight: 'test1\ntest2',
            expected: '  test1\n  test2',
        })

        indentTest('should work with DOS linebreaks', {
            code: '  {{{NoteHighlight}}}',
            highlight: 'test1\r\ntest2',
            expected: '  test1\n  test2',
        })

        indentTest('should work with HTML linebreaks', {
            code: '  {{{NoteHighlight}}}',
            highlight: 'test1<br>test2<br/>test3<br />test4',
            expected: '  test1\n  test2\n  test3\n  test4',
        })

        indentTest('should work with multiple linebreaks', {
            code: '  {{{NoteHighlight}}}',
            highlight: 'test1\ntest2\ntest3',
            expected: '  test1\n  test2\n  test3',
        })

        indentTest('should work with multiple values', {
            code: '  {{{NoteHighlight}}}\n   {{{NoteText}}}\n{{{NoteLink}}}',
            highlight: 'test1\ntest2',
            text: 'test3\ntest4',
            link: 'test5\ntest6',
            expected: '  test1\n  test2\n   test3\n   test4\ntest5\ntest6',
        })

        indentTest('should continue bullet point identation', {
            code: '  * {{{NoteHighlight}}}',
            highlight: 'test1\ntest2',
            expected: '  * test1\n    test2',
        })
        indentTest(
            'should continue bullet point identation with multiple values',
            {
                code: '  * {{{NoteHighlight}}}\n   * {{{NoteText}}}',
                highlight: 'test1\ntest2',
                text: 'test3\ntest4',
                expected: '  * test1\n    test2\n   * test3\n     test4',
            },
        )

        indentTest(
            'should work if value after bullet point is surrounded by quotes',
            {
                code: '  * "{{{NoteHighlight}}}"',
                highlight: 'test1\ntest2',
                expected: '  * "test1\n    test2"',
            },
        )

        indentTest(
            'should work if value after bullet point is surrounded by quotes with multiple values',
            {
                code: '  * "{{{NoteHighlight}}}"\n   * "{{{NoteText}}}"',
                highlight: 'test1\ntest2',
                text: 'test3\ntest4',
                expected: '  * "test1\n    test2"\n   * "test3\n     test4"',
            },
        )
    })

    it('should not render anything inside the {{#literal}} tag', () => {
        expect(
            renderTemplate(
                {
                    code: 'test {{#literal}}{{{[TODO]}}}{{/literal}} test',
                },
                {},
            ),
        ).toEqual(`test {{{[TODO]}}} test`)
    })
})
