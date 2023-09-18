import {
    StorageModule,
    StorageModuleConfig,
    StorageModuleConstructorArgs,
} from '@worldbrain/storex-pattern-modules'
import { normalizeUrl } from '@worldbrain/memex-common/lib/url-utils/normalize'
import { ReadableData } from 'src/reader/types'
// import Readability from 'readability/Readability'
import {
    COLLECTION_DEFINITIONS,
    COLLECTION_NAMES,
} from '@worldbrain/memex-common/lib/storage/modules/reader/constants'

export default class ReaderStorage extends StorageModule {
    static READER_COLL = COLLECTION_NAMES.readablePage

    constructor(private options: StorageModuleConstructorArgs) {
        super(options)
    }

    getConfig = (): StorageModuleConfig => ({
        collections: {
            ...COLLECTION_DEFINITIONS,
        },
        operations: {
            createReadable: {
                operation: 'createObject',
                collection: ReaderStorage.READER_COLL,
            },
            findReadableByUrl: {
                operation: 'findObject',
                collection: ReaderStorage.READER_COLL,
                args: {
                    url: '$url:string',
                },
            },
        },
    })

    readableExists = async (url: string): Promise<boolean> => {
        const normalizedUrl = normalizeUrl(url, {})
        const existingPage = await this.operation('findReadableByUrl', {
            url: normalizedUrl,
        })
        return !!existingPage
    }

    createReadableIfNotExists = async (
        readableData: ReadableData,
    ): Promise<void> => {
        const normalizedUrl = normalizeUrl(readableData.url, {})
        const exists = await this.readableExists(normalizedUrl)
        if (!exists) {
            await this.operation('createReadable', {
                ...readableData,
                url: normalizedUrl,
            })
        }
    }

    parseAndSaveReadable = async ({
        fullUrl,
        doc,
    }: {
        fullUrl: string
        doc?: Document
    }): Promise<ReadableData> => {
        return null
    }

    getReadable = (url: string): Promise<ReadableData | null> => {
        const normalizedUrl = normalizeUrl(url, {})
        return this.operation('findReadableByUrl', { url: normalizedUrl })
    }
}
