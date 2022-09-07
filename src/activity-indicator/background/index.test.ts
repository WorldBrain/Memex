import { setupBackgroundIntegrationTest } from 'src/tests/background-integration-tests'
import { MemoryAuthService } from '@worldbrain/memex-common/lib/authentication/memory'
import { UserReference } from '@worldbrain/memex-common/lib/web-interface/types/users'

async function setupTest() {
    const {
        backgroundModules,
        getServerStorage,
        authServices,
        services,
    } = await setupBackgroundIntegrationTest()

    return {
        activityIndicatorBG: backgroundModules.activityIndicator,
        getServerStorage,
        authServices,
        services,
    }
}

describe('Activity indicator background tests', () => {
    it('should signal on checking for unseen activities when logged out', async () => {
        const {
            activityIndicatorBG,
            authServices: { auth },
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
            services: { activityStreams },
            authServices: { auth },
        } = await setupTest()

        const loginTestUser = ({ id }: UserReference) => {
            auth.signOut()
            return (auth as MemoryAuthService).loginWithEmailAndPassword(
                id as string,
                'password',
            )
        }

        const userAReference: UserReference = {
            type: 'user-reference',
            id: 'test-1',
        }
        const userBReference: UserReference = {
            type: 'user-reference',
            id: 'test-2',
        }

        await loginTestUser(userAReference)

        // Not yet any activity
        expect(await activityIndicatorBG.checkActivityStatus()).toEqual(
            'all-seen',
        )

        // Set up pre-req data
        const { modules: storageModules } = await getServerStorage()

        await storageModules.users.ensureUser(
            { displayName: userAReference.id as string },
            userAReference,
        )
        await storageModules.users.ensureUser(
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

        await activityStreams.followEntity({
            entityType: 'sharedPageInfo',
            entity: pageInfoReference,
            feeds: { home: true },
        })

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
        // Ensure the annot author follows their own annot
        await activityStreams.followEntity({
            entityType: 'conversationThread',
            entity: {
                id: sharedAnnotationReferences['test.com#123'].id,
                type: 'conversation-thread-reference',
            },
            feeds: { home: true },
        })
        const {
            reference: replyReference,
            threadReference,
        } = await storageModules.contentConversations.createReply({
            previousReplyReference: null,
            annotationReference: sharedAnnotationReferences['test.com#123'],
            normalizedPageUrl: 'test.com',
            pageCreatorReference: userAReference,
            sharedListReference: null, // TODO: maybe update test to use lists
            userReference: userBReference,
            reply: { content: 'TEST' },
        })

        // Login as other user so that reply activity gets assoc. with them (they are the replier)
        await loginTestUser(userBReference)

        await activityStreams.addActivity({
            entityType: 'conversationThread',
            entity: threadReference,
            activityType: 'conversationReply',
            activity: {
                annotationReference: sharedAnnotationReferences['test.com#123'],
                replyReference,
            },
        })

        // Log back in as original user (annotation author), to check their activity status
        await loginTestUser(userAReference)

        expect(await activityIndicatorBG.checkActivityStatus()).toEqual(
            'has-unseen',
        )

        await activityIndicatorBG.markActivitiesAsSeen()
        expect(await activityIndicatorBG.checkActivityStatus()).toEqual(
            'all-seen',
        )
    })

    it('should be able to mark activities as seen', async () => {
        const {
            activityIndicatorBG,
            authServices: { auth },
        } = await setupTest()

        await (auth as MemoryAuthService).loginWithEmailAndPassword(
            'test',
            'password',
        )

        expect(
            await activityIndicatorBG[
                'options'
            ].syncSettings.activityIndicator.get('feedHasActivity'),
        ).toEqual(null)

        await activityIndicatorBG.markActivitiesAsSeen()

        expect(
            await activityIndicatorBG[
                'options'
            ].syncSettings.activityIndicator.get('feedHasActivity'),
        ).toEqual(false)
    })
})
