export interface ReadableData {
    content: string
    title: string
    url: string
    length: string
    created: number
    strategy: ReadableStrategy
}

export type ReadableStrategy = 'mozilla/readability'

export interface RemoteReaderInterface {
    readableExists: (url: string) => Promise<boolean>
    getReadableVersion: (url: string) => Promise<ReadableData>
    setReadableVersion: (data: ReadableData) => Promise<void>
    parseAndSaveReadable: (o: {
        fullUrl: string
        doc?: Document
    }) => Promise<ReadableData>
}
