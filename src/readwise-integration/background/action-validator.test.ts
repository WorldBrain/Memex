import { readwiseActionValidator } from './action-validator'
import * as DATA from './index.test.data'

describe('Readwise action validator', () => {
    it('should accept valid highlight posts', () => {
        expect(
            readwiseActionValidator({
                action: {
                    type: 'post-highlights',
                    highlights: [DATA.HIGHLIGHT_1('test')],
                },
            }),
        ).toEqual({ valid: true })
    })

    it('should reject highlights without a highlight body', () => {
        expect(
            readwiseActionValidator({
                action: {
                    type: 'post-highlights',
                    highlights: [
                        {
                            ...DATA.HIGHLIGHT_1('test'),
                            text: undefined,
                        },
                    ],
                },
            }),
        ).toEqual({
            valid: false,
            message: `highlight in action 'post-highlights' has missing 'text' field`,
        })
    })

    it('should reject highlights empty string fields', () => {
        expect(
            readwiseActionValidator({
                action: {
                    type: 'post-highlights',
                    highlights: [
                        {
                            ...DATA.HIGHLIGHT_1('test'),
                            text: '',
                        },
                    ],
                },
            }),
        ).toEqual({
            valid: false,
            message: `highlight in action 'post-highlights' has empty 'text' string field`,
        })
    })
})
