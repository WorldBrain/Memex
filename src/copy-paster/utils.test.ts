import { analyzeTemplate, generateTemplateDocs } from './utils'
import { KEYS_TO_REQUIREMENTS, LEGACY_KEYS, NOTE_KEYS } from './constants'
import { TemplateDocKey, TemplateAnalysis, TemplateDataFetchers } from './types'

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

describe('Content template doc generation', () => {
    const testTemplate = { isFavourite: false, title: 'test', id: -1 }
    // TODO: Properly set up storage and everything else
    const testDataFetchers = (): TemplateDataFetchers => {
        return {} as any
    }

    const testPageAUrl = ''
    const testPageATags = ['']
    const testPageBUrl = ''
    const testPageBTags = ['']

    // Children of page A
    const testAnnotationAUrl = ''
    const testAnnotationATags = ['']
    const testAnnotationAText = ''
    const testAnnotationBUrl = ''
    const testAnnotationBTags = ['']
    const testAnnotationBHighlight = ''

    it('should correctly generate template docs for a single page', async () => {
        expect(
            await generateTemplateDocs({
                template: { ...testTemplate, code: '{{{PageTitle}}}' },
                normalizedPageUrls: [testPageAUrl],
                annotationUrls: [],
                dataFetchers: testDataFetchers(),
            }),
        ).toEqual([
            {
                PageTitle: 'test page A title',
                PageUrl: testPageAUrl,
                PageTags: testPageATags,
                title: 'test page A title',
                url: testPageAUrl,
                tags: testPageATags,
            },
        ])
    })

    it('should correctly generate template docs for multiple pages', async () => {
        expect(
            await generateTemplateDocs({
                template: {
                    ...testTemplate,
                    code: '{{#Pages}}{{{PageTitle}}}{{/Pages}}',
                },
                normalizedPageUrls: [testPageAUrl, testPageBUrl],
                annotationUrls: [],
                dataFetchers: testDataFetchers(),
            }),
        ).toEqual([
            {
                PageTitle: 'test page A title',
                PageTags: testPageATags,
                PageUrl: testPageAUrl,
                title: 'test page A title',
                tags: testPageATags,
                url: testPageAUrl,
            },
            {
                PageTitle: 'test page B title',
                PageTags: testPageBTags,
                PageUrl: testPageBUrl,
                title: 'test page B title',
                tags: testPageBTags,
                url: testPageBUrl,
            },
        ])
    })

    it('should correctly generate template docs for single annotation, but only with page references', async () => {
        expect(
            await generateTemplateDocs({
                template: { ...testTemplate, code: '{{{PageTitle}}}' },
                normalizedPageUrls: [testPageAUrl],
                annotationUrls: [testAnnotationAUrl],
                dataFetchers: testDataFetchers(),
            }),
        ).toEqual([
            {
                PageTitle: 'test page A title',
                PageTags: testPageATags,
                PageUrl: testPageAUrl,
                title: 'test page A title',
                tags: testPageATags,
                url: testPageAUrl,
            },
        ])
    })

    it('should correctly generate template docs for single annotation', async () => {
        expect(
            await generateTemplateDocs({
                template: { ...testTemplate, code: '{{{NoteText}}}' },
                normalizedPageUrls: [testPageAUrl],
                annotationUrls: [testAnnotationAUrl],
                dataFetchers: testDataFetchers(),
            }),
        ).toEqual([
            {
                PageTitle: 'test page A title',
                PageTags: testPageATags,
                PageUrl: testPageAUrl,
                NoteText: testAnnotationAText,
                NoteTags: testAnnotationATags,

                title: 'test page A title',
                tags: testPageATags,
                url: testPageAUrl,
            },
        ])
    })

    it('should correctly generate template docs for single annotation, but iterating through the notes array', async () => {
        expect(
            await generateTemplateDocs({
                template: {
                    ...testTemplate,
                    code: '{{#Notes}}{{{NoteText}}}{{/Notes}}',
                },
                normalizedPageUrls: [testPageAUrl],
                annotationUrls: [testAnnotationAUrl],
                dataFetchers: testDataFetchers(),
            }),
        ).toEqual([
            {
                PageTitle: 'test page A title',
                PageTags: testPageATags,
                PageUrl: testPageAUrl,
                Notes: [
                    {
                        NoteText: testAnnotationAText,
                        NoteTags: testAnnotationATags,
                    },
                ],

                title: 'test page A title',
                tags: testPageATags,
                url: testPageAUrl,
            },
        ])
    })

    it('should correctly generate template docs for multiple annotations, but only with page references', async () => {
        expect(
            await generateTemplateDocs({
                template: { ...testTemplate, code: '{{{PageTitle}}}' },
                normalizedPageUrls: [testPageAUrl],
                annotationUrls: [testAnnotationAUrl, testAnnotationBUrl],
                dataFetchers: testDataFetchers(),
            }),
        ).toEqual([
            {
                PageTitle: 'test page A title',
                PageTags: testPageATags,
                PageUrl: testPageAUrl,

                title: 'test page A title',
                tags: testPageATags,
                url: testPageAUrl,
            },
        ])
    })

    it('should correctly generate template docs for multiple annotations, but only referencing top-level annotation', async () => {
        expect(
            await generateTemplateDocs({
                template: { ...testTemplate, code: '{{{NoteText}}}' },
                normalizedPageUrls: [testPageAUrl],
                annotationUrls: [testAnnotationAUrl, testAnnotationBUrl],
                dataFetchers: testDataFetchers(),
            }),
        ).toEqual([
            {
                PageTitle: 'test page A title',
                PageTags: testPageATags,
                PageUrl: testPageAUrl,
                NoteText: testAnnotationAText,

                title: 'test page A title',
                tags: testPageATags,
                url: testPageAUrl,
            },
        ])
    })

    it('should correctly generate template docs for multiple annotations', async () => {
        expect(
            await generateTemplateDocs({
                template: {
                    ...testTemplate,
                    code: '{{#Notes}}{{{NoteText}}}{{/Notes}}',
                },
                normalizedPageUrls: [testPageAUrl],
                annotationUrls: [testAnnotationAUrl, testAnnotationBUrl],
                dataFetchers: testDataFetchers(),
            }),
        ).toEqual([
            {
                PageTitle: 'test page A title',
                PageTags: testPageATags,
                PageUrl: testPageAUrl,
                Notes: [
                    {
                        NoteText: testAnnotationAText,
                        NoteTags: testAnnotationATags,
                    },
                    {
                        NoteHighlight: testAnnotationBHighlight,
                        NoteTags: testAnnotationBTags,
                    },
                ],

                title: 'test page A title',
                tags: testPageATags,
                url: testPageAUrl,
            },
        ])
    })
})
