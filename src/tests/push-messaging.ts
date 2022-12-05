import type {
    PushMessagePayload,
    PushMessagingServiceInterface,
} from '@worldbrain/memex-common/lib/push-messaging/types'
import type { AutoPk } from '@worldbrain/memex-common/lib/storage/types'

export class MockPushMessagingService implements PushMessagingServiceInterface {
    topicSubscribers = new Map<string, Set<AutoPk>>()
    sentMessages: Array<
        {
            payload: PushMessagePayload
        } & (
            | { type: 'to-topic'; topic: string }
            | { type: 'to-user'; userId: AutoPk }
        )
    > = []

    subscribeUserToTopic: PushMessagingServiceInterface['subscribeUserToTopic'] = async (
        userReference,
        topic,
    ) => {
        const existing = this.topicSubscribers.get(topic) ?? new Set()
        existing.add(userReference.id)
    }

    unsubscribeUserFromTopic: PushMessagingServiceInterface['unsubscribeUserFromTopic'] = async (
        userReference,
        topic,
    ) => {
        const existing = this.topicSubscribers.get(topic) ?? new Set()
        existing.delete(userReference.id)
    }

    sendToTopic: PushMessagingServiceInterface['sendToTopic'] = async (
        topic,
        payload,
    ) => {
        this.sentMessages.push({
            type: 'to-topic',
            topic,
            payload,
        })
    }

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
