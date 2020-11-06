import { readwiseActionPreprocessor } from './action-preprocessor'
import * as DATA from './index.test.data'

describe('Readwise action validator', () => {
    it('should accept valid highlight posts', () => {
        expect(
            readwiseActionPreprocessor({
                action: {
                    type: 'post-highlights',
                    highlights: [DATA.HIGHLIGHT_1('test')],
                },
            }),
        ).toEqual({
            valid: true,
            processed: {
                type: 'post-highlights',
                highlights: [DATA.HIGHLIGHT_1('test')],
            },
        })
    })

    it('should reject highlights without a highlight body', () => {
        expect(
            readwiseActionPreprocessor({
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
            validationError: `highlight in action 'post-highlights' has missing 'text' field`,
        })
    })

    // it('should reject highlights empty string fields', () => {
    //     expect(
    //         readwiseActionPreprocessor({
    //             action: {
    //                 type: 'post-highlights',
    //                 highlights: [
    //                     {
    //                         ...DATA.HIGHLIGHT_1('test'),
    //                         text: '',
    //                     },
    //                 ],
    //             },
    //         }),
    //     ).toEqual({
    //         valid: false,
    //         validationError: `highlight in action 'post-highlights' has empty 'text' string field`,
    //     })
    // })

    it('should strip whitespace from actions', () => {
        expect(
            readwiseActionPreprocessor({
                action: {
                    type: 'post-highlights',
                    highlights: [
                        {
                            ...DATA.HIGHLIGHT_1('test'),
                            note: DATA.HIGHLIGHT_1('test').note + '\n',
                        },
                    ],
                },
            }),
        ).toEqual({
            valid: true,
            processed: {
                type: 'post-highlights',
                highlights: [
                    {
                        ...DATA.HIGHLIGHT_1('test'),
                    },
                ],
            },
        })
    })

    it('should convert empty strings to null values', () => {
        expect(
            readwiseActionPreprocessor({
                action: {
                    type: 'post-highlights',
                    highlights: [
                        {
                            ...DATA.HIGHLIGHT_1('test'),
                            note: '',
                        },
                    ],
                },
            }),
        ).toEqual({
            valid: true,
            processed: {
                type: 'post-highlights',
                highlights: [
                    {
                        ...DATA.HIGHLIGHT_1('test'),
                        note: null,
                    },
                ],
            },
        })
    })
})
