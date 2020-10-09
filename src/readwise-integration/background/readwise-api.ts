import { ReadwiseAPI, ReadwiseHighlight } from './types'

export class HTTPReadwiseAPI implements ReadwiseAPI {
    async putHighlight(params: { highlight: ReadwiseHighlight; key: string }) {
        return { success: false }
    }

    async validateKey(key: string) {
        throw new Error('Not implemented yet')
        return { success: false }
    }
}
