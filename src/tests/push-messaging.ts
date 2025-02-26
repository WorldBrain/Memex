import type {
    PushMessagePayload,
    PushMessagingServiceInterface,
} from '@worldbrain/memex-common/lib/push-messaging/types'
import type { AutoPk } from '@worldbrain/memex-common/lib/storage/types'

export class MockPushMessagingService implements PushMessagingServiceInterface {
    sentMessages: Array<
        {
            payload: PushMessagePayload
        } & (
            | { type: 'to-topic'; topic: string }
            | { type: 'to-user'; userId: AutoPk }
        )
    > = []

    sendToUser: PushMessagingServiceInterface['sendToUser'] = async (
        userReference,
        payload,
    ) => {
        this.sentMessages.push({
            type: 'to-user',
            userId: userReference.id,
            payload,
        })
    }
}
