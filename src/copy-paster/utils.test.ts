import { analyzeTemplate } from './utils'
import { KEYS_TO_REQUIREMENTS, LEGACY_KEYS } from './constants'
import { TemplateDoc } from './types'

describe('Content template rendering', () => {
    it('should correctly analyze templates', () => {
        for (const [key, requirement] of Object.entries(KEYS_TO_REQUIREMENTS)) {
            const code = `{{{${key}}}}`
            const analysis = analyzeTemplate({ code })
            expect({ code, analysis }).toEqual({
                code,
                analysis: {
                    requirements: expect.objectContaining({
                        [requirement]: true,
                    }),
                    usesLegacyTags: LEGACY_KEYS.has(key as keyof TemplateDoc),
                },
            })
        }
    })
})
