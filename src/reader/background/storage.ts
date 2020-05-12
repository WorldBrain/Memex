import {
    StorageModule,
    StorageModuleConfig,
    StorageModuleConstructorArgs,
} from '@worldbrain/storex-pattern-modules'
import { normalizeUrl } from '@worldbrain/memex-url-utils'
import { ReadableData } from 'src/reader/types'
import { now } from 'moment'
import Readability from 'readability/Readability'
import { fetchDOMFromUrl } from 'src/page-analysis/background/fetch-page-data'
export default class ReaderStorage extends StorageModule {
    constructor(private options: StorageModuleConstructorArgs) {
        super(options)
    }

    getConfig = (): StorageModuleConfig => ({
        collections: {
            readable: {
                version: new Date('2020-05-12'),
                fields: {
                    url: { type: 'string' },
                    fullUrl: { type: 'text' },
                    title: { type: 'string' },
                    content: { type: 'text', optional: true },
                    strategy: { type: 'string' },
                },
                indices: [
                    { field: 'url', pk: true },
                    { field: 'fullUrl' },
                    { field: 'title' },
                ],
            },
        },
        operations: {
            createReadable: {
                operation: 'createObject',
                collection: 'readable',
            },
            findReadableByUrl: {
                operation: 'findObject',
                collection: 'readable',
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
        const normalizedUrl = normalizeUrl(fullUrl, {})

        let document = doc
        if (!document) {
            console.log(`Reader::Parser Document fetching from URL ${fullUrl}`)
            document = await fetchDOMFromUrl(fullUrl, 5000).run()
        } else {
            console.log(`Reader::Parser Document given`)
        }

        console.log(
            `Reader::Parser Original Doc Size - ${
                document.body.outerHTML.length / 1000
            }k`,
        )
        console.time('Reader::Parser::ParseTime')
        const article = new Readability(document).parse()
        console.timeEnd('Reader::Parser::ParseTime')
        console.log(
            `Reader::Parser Readable Doc Size - ${
                document.body.outerHTML.length / 1000
            }k`,
        )

        const readableData = {
            title: article.title,
            content: article.content,
            url: normalizedUrl,
            fullUrl,
            strategy: 'mozilla/readability',
            created: now(),
        }

        await this.operation('createReadable', {
            ...readableData,
            url: normalizedUrl,
        })

        return readableData as ReadableData
    }

    getReadable = (url: string): Promise<ReadableData | null> => {
        const normalizedUrl = normalizeUrl(url, {})
        return this.operation('findReadableByUrl', { url: normalizedUrl })
    }
}
