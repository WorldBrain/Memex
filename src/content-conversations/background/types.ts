import type {
    SharedAnnotationReference,
    SharedListReference,
} from '@worldbrain/memex-common/lib/content-sharing/types'
import type {
    PreparedAnnotationReply,
    PreparedThread,
} from '@worldbrain/memex-common/lib/content-conversations/storage/types'
import type { ConversationThreadReference } from '@worldbrain/memex-common/lib/content-conversations/types'
import type { UserReference } from '@worldbrain/memex-common/lib/web-interface/types/users'
import type { ContentConversationsServiceInterface } from '@worldbrain/memex-common/lib/content-conversations/service/types'

export interface ContentConversationsInterface
    extends Pick<ContentConversationsServiceInterface, 'submitReply'> {
    getRepliesBySharedAnnotation(params: {
        sharedAnnotationReference: SharedAnnotationReference
    }): Promise<PreparedAnnotationReply[]>
    getThreadsForSharedAnnotations(params: {
        sharedAnnotationReferences: SharedAnnotationReference[]
    }): Promise<PreparedThread[]>
    getOrCreateThread(params: {
        normalizedPageUrl: string
        pageCreatorReference: UserReference
        sharedListReference: SharedListReference | null
        sharedAnnotationReference: SharedAnnotationReference
    }): Promise<{
        updatedWhen: number
        normalizedPageUrl: string
        reference: ConversationThreadReference
    }>
}
