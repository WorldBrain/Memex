export default class ContinuousSync {
    async enableContinuousSync(): Promise<void> {}

    async forceIncrementalSync(): Promise<void> {
        // const { storage, auth } = this.options
        // const userId = auth.getUserId()
        // if (!userId) {
        //     throw new Error(`Cannot Sync without authenticated user`)
        // }
        // await doSync({
        //     clientSyncLog: storage.modules.clientSyncLog,
        //     sharedSyncLog: storage.modules.sharedSyncLog,
        //     storageManager: storage.clientManager,
        //     reconciler: reconcileSyncLog,
        //     now: '$now',
        //     userId,
        //     deviceId: options.deviceId,
        // })
    }
}
