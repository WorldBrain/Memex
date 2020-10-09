import MemoryBrowserStorage, {
    LimitedBrowserStorage,
} from 'src/util/tests/browser-storage'
import { ReadwiseResponse } from './types'

export class ReadwiseBackground {
    mostRecentResponse?: ReadwiseResponse

    constructor(
        private options: {
            browserStorage: LimitedBrowserStorage
        },
    ) {}
    async getAPIKey() {}
    async setAPIKey(newValue: string) {}
}
