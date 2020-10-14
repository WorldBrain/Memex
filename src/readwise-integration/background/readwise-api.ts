import { ReadwiseAPI, ReadwiseHighlight } from './types/api'
import { READWISE_API_URL } from './constants'

export class HTTPReadwiseAPI implements ReadwiseAPI {
    constructor(
        private options: {
            fetch: typeof fetch
        },
    ) {}

    async postHighlights(params: {
        highlights: ReadwiseHighlight[]
        key: string
    }) {
        const response = await this.options.fetch(READWISE_API_URL, {
            method: 'POST',
            headers: {
                Authorization: `Token ${params.key}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                highlights: params.highlights.map((highlight) => ({
                    ...highlight,
                    highlighted_at: highlight.highlighted_at.toISOString(),
                })),
            }),
        })
        return { success: response.status === 200 }
    }

    async validateKey(key: string) {
        const response = await this.options.fetch(READWISE_API_URL, {
            method: 'GET',
            headers: {
                Authorization: `Token ${key}`,
                'Content-Type': 'application/json',
            },
        })
        return { success: response.status === 200 || response.status === 204 }
    }
}
