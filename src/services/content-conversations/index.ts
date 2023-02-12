import {
    ContentConversationsServiceInterface,
    CreateReplyResult,
} from '@worldbrain/memex-common/lib/content-conversations/service/types'
import type { CreateConversationReplyParams } from '@worldbrain/memex-common/lib/content-conversations/storage/types'
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

    async submitReply(
        params: Omit<CreateConversationReplyParams, 'userReferences'>,
    ): Promise<CreateReplyResult> {
        const { services, storage } = this.options

        const user = await services.auth.getCurrentUser()
        if (!user) {
            return { status: 'not-authenticated' }
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
}
