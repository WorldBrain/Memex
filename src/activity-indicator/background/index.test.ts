import { setupBackgroundIntegrationTest } from 'src/tests/background-integration-tests'
import { MemoryAuthService } from '@worldbrain/memex-common/lib/authentication/memory'
import { UserReference } from '@worldbrain/memex-common/lib/web-interface/types/users'
import { SharedAnnotationReference } from '@worldbrain/memex-common/lib/content-sharing/types'

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

        const userAReference: UserReference = {
            type: 'user-reference',
            id: 'test-1',
        }
        const userBReference: UserReference = {
            type: 'user-reference',
            id: 'test-2',
        }
        await (auth as MemoryAuthService).loginWithEmailAndPassword(
            userBReference.id as string,
            'password',
        )

        // Not yet any activity
        expect(await activityIndicatorBG.checkActivityStatus()).toEqual(
            'all-seen',
        )

        // Set up test data + add reply activity
        const { storageModules } = await getServerStorage()

        await storageModules.userManagement.ensureUser(
            { displayName: userAReference.id as string },
            userAReference,
        )
        await storageModules.userManagement.ensureUser(
            { displayName: userBReference.id as string },
            userBReference,
        )

        const pageInfoReference = await storageModules.contentSharing.createPageInfo(
            {
                creatorReference: userAReference,
                pageInfo: {
                    fullTitle: 'AAAA',
                    originalUrl: 'https://test.com',
                    normalizedUrl: 'test.com',
                },
            },
        )
        const {
            sharedAnnotationReferences,
        } = await storageModules.contentSharing.createAnnotations({
            creator: userAReference,
            listReferences: [],
            annotationsByPage: {
                ['test.com']: [
                    {
                        localId: 'test.com#123',
                        createdWhen: Date.now(),
                        comment: 'TESST',
                    },
                ],
            },
        })

        const {
            reference: replyReference,
        } = await storageModules.contentConversations.createReply({
            annotationReference: sharedAnnotationReferences['test.com#123'],
            normalizedPageUrl: 'test.com',
            pageCreatorReference: userAReference,
            userReference: userBReference,
            reply: { content: 'TEST' },
        })

        await activityStreams.addActivity({
            activityType: 'conversationReply',
            entityType: 'sharedAnnotation',
            entity: sharedAnnotationReferences['test.com#123'],
            activity: {
                isFirstReply: true,
                replyReference,
            },
            follow: { home: true },
        })

        // Login as other user so that the activity should show up in stream
        auth.signOut()
        await (auth as MemoryAuthService).loginWithEmailAndPassword(
            userAReference.id as string,
            'password',
        )

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
