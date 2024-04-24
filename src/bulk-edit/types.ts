export type BulkEditItem = {
    type: 'page' | 'note'
}

export type BulkEditCollection = {
    [key: string]: BulkEditItem
}
