import {
    StorageModule,
    StorageModuleConfig,
} from '@worldbrain/storex-pattern-modules'
import { COLLECTION_DEFINITIONS as PAGE_COLLECTION_DEFINITIONS } from '@worldbrain/memex-storage/lib/pages/constants'
import { PipelineRes } from 'src/search'

export default class PageStorage extends StorageModule {
    getConfig = (): StorageModuleConfig => ({
        collections: {
            ...PAGE_COLLECTION_DEFINITIONS,
        },
        operations: {},
    })

    async updatePageContent(
        content: Pick<PipelineRes, 'url' | 'fullTitle' | 'text'>,
    ) {}

    async pageHasVisits(url: string): Promise<boolean> {}

    async addPageVisit(url: string, time: number) {}
}
