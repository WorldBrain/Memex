export interface PublicSyncInterface {
    requestInitialSync(options?: {
        excludePassiveData?: boolean
    }): Promise<{ initialMessage: string }>
    answerInitialSync(options: { initialMessage: string }): Promise<void>
    waitForInitialSync(): Promise<void>

    enableContinuousSync(): Promise<void>
    forceIncrementalSync(): Promise<void>
}
