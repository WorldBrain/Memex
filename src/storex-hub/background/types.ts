export interface IndexPageArgs {
    url: string
    visitTime?: number
    bookmark?: true | { creationTime: number }
    tags?: string[]
    lists?: number[]
}
