import { setupBackgroundIntegrationTest } from 'src/tests/background-integration-tests'
import type { UserReference } from '@worldbrain/memex-common/lib/web-interface/types/users'

async function setupTest() {
    const {
        backgroundModules,
        serverStorage,
        authService,
        services,
    } = await setupBackgroundIntegrationTest()

    return {
        backgroundModules,
        serverStorage,
        authService,
        services,
    }
}

describe('Activity indicator background tests', () => {
    it('should signal on checking for unseen activities when logged out', async () => {
        const { backgroundModules, authService } = await setupTest()
        authService.signOut()

        expect(
            await backgroundModules.activityIndicator.checkActivityStatus(),
        ).toEqual('not-logged-in')
    })

    // TODO: Fix this test

    it.skip('should be able to check for unseen activities', async () => {
        return
        const {
            backgroundModules,
            serverStorage,
            services: { activityStreams },
            authService,
        } = await setupTest()

        const loginTestUser = ({ id }: UserReference) => {
            authService.signOut()
            return authService.loginWithEmailAndPassword(
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
        expect(
            await backgroundModules.activityIndicator.checkActivityStatus(),
        ).toEqual('all-seen')

        // Set up pre-req data
        const { modules: storageModules } = serverStorage

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

        const sharedListReference = await storageModules.contentSharing.createSharedList(
            { userReference: userAReference, listData: { title: 'test list' } },
        )
        await activityStreams.followEntity({
            entityType: 'sharedList',
            entity: sharedListReference,
            feeds: { home: true },
        })

        const {
            sharedAnnotationReferences,
        } = await storageModules.contentSharing.createAnnotations({
            creator: userAReference,
            listReferences: [sharedListReference],
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
            sharedListReference,
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

        // NOTE: Checking pending sync counts here to ensure no noop sync entries get created just for checking
        expect(
            backgroundModules.personalCloud.actionQueue.pendingActionCount,
        ).toBe(1)
        expect(
            await backgroundModules.activityIndicator.checkActivityStatus(),
        ).toEqual('has-unseen')

        await backgroundModules.activityIndicator.markActivitiesAsSeen()

        expect(
            backgroundModules.personalCloud.actionQueue.pendingActionCount,
        ).toBe(3)
        expect(
            await backgroundModules.activityIndicator.checkActivityStatus(),
        ).toEqual('all-seen')
        expect(
            backgroundModules.personalCloud.actionQueue.pendingActionCount,
        ).toBe(3)

        // Checking again, when nothing should have changed, should not write to storage again (to avoid creating a noop sync entry)
        expect(
            await backgroundModules.activityIndicator.checkActivityStatus(),
        ).toEqual('all-seen')

        expect(
            backgroundModules.personalCloud.actionQueue.pendingActionCount,
        ).toBe(3)
    })

    it('should be able to mark activities as seen', async () => {
        const { backgroundModules, authService } = await setupTest()

        await authService.loginWithEmailAndPassword('test', 'password')

        expect(
            await backgroundModules.activityIndicator[
                'options'
            ].syncSettings.activityIndicator.get('feedHasActivity'),
        ).toEqual(null)

        await backgroundModules.activityIndicator.markActivitiesAsSeen()

        expect(
            await backgroundModules.activityIndicator[
                'options'
            ].syncSettings.activityIndicator.get('feedHasActivity'),
        ).toEqual(false)
    })
})
