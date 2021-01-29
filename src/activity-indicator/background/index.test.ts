import { setupBackgroundIntegrationTest } from 'src/tests/background-integration-tests'
import { MemoryAuthService } from '@worldbrain/memex-common/lib/authentication/memory'

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
            services: { activityStreams, auth },
        } = await setupTest()

        await (auth as MemoryAuthService).loginWithEmailAndPassword(
            'test',
            'password',
        )

        // Not yet any activity
        expect(await activityIndicatorBG.checkActivityStatus()).toEqual(
            'all-seen',
        )

        await activityStreams.addActivity({
            activityType: 'sharedListEntry',
            entityType: 'sharedList',
            activity: {
                entryReference: {
                    type: 'shared-list-entry-reference',
                    id: 'test-list',
                },
            },
            entity: {
                type: 'shared-list-reference',
                id: 'test-list',
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
