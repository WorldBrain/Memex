import {
    SharedAnnotationReference,
    SharedListReference,
} from '@worldbrain/memex-common/lib/content-sharing/types'
import {
    PreparedAnnotationReply,
    PreparedThread,
} from '@worldbrain/memex-common/lib/content-conversations/storage/types'
import { ConversationThreadReference } from '@worldbrain/memex-common/lib/content-conversations/types'
import { UserReference } from '@worldbrain/memex-common/lib/web-interface/types/users'

export interface ContentConversationsInterface {
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
