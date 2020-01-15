import mapValues from 'lodash/mapValues'
import { setupBackgroundIntegrationTest } from 'src/tests/background-integration-tests'

describe('Backup feature', () => {
    it('should only select to back up the collections we want to back up', async () => {
        const setup = await setupBackgroundIntegrationTest()
        const backedUp = mapValues(
            setup.storageManager.registry.collections,
            (collectionDef, collectionName) => {
                return {
                    backup: collectionDef.backup ?? true,
                    watch: collectionDef.watch ?? true,
                }
            },
        )

        expect(backedUp).toEqual({
            pages: { backup: true, watch: true },
            visits: { backup: true, watch: true },
            bookmarks: { backup: true, watch: true },
            favIcons: { backup: true, watch: true },
            annotations: { backup: true, watch: true },
            annotBookmarks: { backup: true, watch: true },
            annotListEntries: { backup: true, watch: true },
            directLinks: { backup: true, watch: true },
            notifications: { backup: true, watch: true },
            customLists: { backup: true, watch: true },
            pageListEntries: { backup: true, watch: true },
            socialPosts: { backup: true, watch: true },
            socialUsers: { backup: true, watch: true },
            socialTags: { backup: true, watch: true },
            socialBookmarks: { backup: true, watch: true },
            socialPostListEntries: { backup: true, watch: true },
            tags: { backup: true, watch: true },

            pageFetchBacklog: { backup: false, watch: false },
            backupChanges: { backup: false, watch: false },
            eventLog: { backup: false, watch: false },
            clientSyncLogEntry: { backup: false, watch: false },
            syncDeviceInfo: { backup: false, watch: false },
        })
    })
})
