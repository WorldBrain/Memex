import { setupBackgroundIntegrationTest } from 'src/tests/background-integration-tests'
import { MemoryAuthService } from '@worldbrain/memex-common/lib/authentication/memory'
import { UserReference } from '@worldbrain/memex-common/lib/web-interface/types/users'

async function setupTest() {
    const {
        backgroundModules,
        getServerStorage,
        services,
    } = await setupBackgroundIntegrationTest()

    return {
        activityIndicatorBG: backgroundModules.activityIndicator,
        getServerStorage,
        services,
    }
}

describe('Activity indicator background tests', () => {
    it('should signal on checking for unseen activities when logged out', async () => {
        const {
            activityIndicatorBG,
            services: { auth },
        } = await setupTest()

        auth.signOut()

        expect(await activityIndicatorBG.checkActivityStatus()).toEqual(
            'not-logged-in',
        )
    })

    it('should be able to check for unseen activities', async () => {
        const {
            activityIndicatorBG,
            getServerStorage,
            services: { activityStreams, auth },
        } = await setupTest()

        await (auth as MemoryAuthService).loginWithEmailAndPassword(
            'test',
            'password',
        )
        const userReference: UserReference = {
            type: 'user-reference',
            id: 'test',
        }

        // Not yet any activity
        expect(await activityIndicatorBG.checkActivityStatus()).toEqual(
            'all-seen',
        )

        const { storageModules } = await getServerStorage()

        await storageModules.userManagement.ensureUser(
            { displayName: 'test' },
            userReference,
        )

        const listReference = await storageModules.contentSharing.createSharedList(
            {
                listData: { title: 'test-list' },
                localListId: 123,
                userReference,
            },
        )

        await storageModules.contentSharing.createListEntries({
            listReference,
            userReference,
            listEntries: [
                {
                    entryTitle: 'test-title',
                    originalUrl: 'test.com',
                    normalizedUrl: 'test.com',
                },
            ],
        })

        await activityStreams.addActivity({
            activityType: 'sharedListEntry',
            entityType: 'sharedList',
            entity: listReference,
            activity: {
                entryReference: {
                    type: 'shared-list-entry-reference',
                    id: 1,
                },
            },
        })

        expect(await activityIndicatorBG.checkActivityStatus()).toEqual(
            'has-unseen',
        )
    })

    it('should be able to mark activities as seen', async () => {
        const {
            getServerStorage,
            activityIndicatorBG,
            services: { auth },
        } = await setupTest()

        await (auth as MemoryAuthService).loginWithEmailAndPassword(
            'test',
            'password',
        )

        const timestamp = 1
        const user = await auth.getCurrentUser()
        const serverStorage = await getServerStorage()

        expect(
            await serverStorage.storageModules.activityStreams.retrieveHomeFeedTimestamp(
                {
                    user: { type: 'user-reference', id: user.id },
                },
            ),
        ).toEqual(null)

        await activityIndicatorBG.markActivitiesAsSeen(timestamp)

        expect(
            await serverStorage.storageModules.activityStreams.retrieveHomeFeedTimestamp(
                {
                    user: { type: 'user-reference', id: user.id },
                },
            ),
        ).toEqual({
            timestamp,
        })
    })
})
