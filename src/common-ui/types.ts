export interface NormalizedState<T> {
    allIds: string[]
    byId: { [id: string]: T }
}
