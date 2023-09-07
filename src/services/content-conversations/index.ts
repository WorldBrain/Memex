import type { AuthenticatedUser } from '@worldbrain/memex-common/lib/authentication/types'
import type { ContentConversationsServiceInterface } from '@worldbrain/memex-common/lib/content-conversations/service/types'
import type { ConversationReplyReference } from '@worldbrain/memex-common/lib/content-conversations/types'
import type { SharedAnnotationReference } from '@worldbrain/memex-common/lib/content-sharing/types'
import type { ServerStorageModules } from 'src/storage/types'
import type { AuthServices } from '../types'

export default class ContentConversationsService
    implements ContentConversationsServiceInterface {
    constructor(
        private options: {
            storage: Pick<ServerStorageModules, 'contentConversations'>
            services: Pick<AuthServices, 'auth'>
        },
    ) {}

    private async hasReplyChangeAuthorization(
        { id: currentUserId }: AuthenticatedUser,
        replyReference: ConversationReplyReference,
        annotationReference: SharedAnnotationReference,
    ): Promise<boolean> {
        const reply = await this.options.storage.contentConversations.getReply({
            replyReference,
            annotationReference,
        })
        return reply?.userReference.id === currentUserId
    }

    submitReply: ContentConversationsServiceInterface['submitReply'] = async (
        params,
    ) => {
        const { services, storage } = this.options

        const user = await services.auth.getCurrentUser()
        if (!user) {
            return { status: 'not-authenticated' }
        }

        if (!params.reply.content.trim().length) {
            return {
                status: 'failure',
                error: new Error('Cannot create an empty reply'),
            }
        }

        try {
            const {
                reference: replyReference,
            } = await storage.contentConversations.createReply({
                userReference: {
                    id: user.id,
                    type: 'user-reference',
                },
                ...params,
            })

            return { status: 'success', replyReference }
        } catch (error) {
            return { status: 'failure', error }
        }
    }

    deleteReply: ContentConversationsServiceInterface['deleteReply'] = async (
        params,
    ) => {
        const user = await this.options.services.auth.getCurrentUser()
        if (!user) {
            return { status: 'not-authenticated' }
        }

        try {
            if (
                !(await this.hasReplyChangeAuthorization(
                    user,
                    params.replyReference,
                    params.annotationReference,
                ))
            ) {
                return { status: 'not-authenticated' }
            }

            await this.options.storage.contentConversations.deleteReply({
                replyReference: params.replyReference,
                annotationReference: params.annotationReference,
            })
            return { status: 'success' }
        } catch (error) {
            return { status: 'failure', error }
        }
    }

    editReply: ContentConversationsServiceInterface['editReply'] = async (
        params,
    ) => {
        const user = await this.options.services.auth.getCurrentUser()
        if (!user) {
            return { status: 'not-authenticated' }
        }

        try {
            if (
                !(await this.hasReplyChangeAuthorization(
                    user,
                    params.replyReference,
                    params.annotationReference,
                ))
            ) {
                return { status: 'not-authenticated' }
            }

            await this.options.storage.contentConversations.editReply({
                content: params.content,
                replyReference: params.replyReference,
                annotationReference: params.annotationReference,
            })
            return { status: 'success', replyReference: params.replyReference }
        } catch (error) {
            return { status: 'failure', error }
        }
    }
}
