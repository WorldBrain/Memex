export interface PkmSyncInterface {
    pushPKMSyncUpdate(item, checkForFilteredSpaces): Promise<void>
}
