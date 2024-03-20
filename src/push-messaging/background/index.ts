import type { PushMessagePayload } from '@worldbrain/memex-common/lib/push-messaging/types'
import type { BackgroundModules } from 'src/background-script/setup'

export default class PushMessagingClient {
    constructor(
        private deps: {
            bgModules: Pick<
                BackgroundModules,
                'personalCloud' | 'pageActivityIndicator'
            >
        },
    ) {}

    handleIncomingMessage(
        payload: PushMessagePayload,
        opts?: { now?: number },
    ): void {
        const { bgModules } = this.deps
        if (payload.type === 'downloadClientUpdates') {
            bgModules.personalCloud.options.backend.events.emit(
                'incomingChangesPending',
                { changeCountDelta: 1 },
            )
            bgModules.personalCloud.triggerSyncContinuation()
        }
        // This is the setup for the old FCM-based implementation for page activity indicator
        // } else if (payload.type === 'createPageListEntry') {
        //     await bgModules.pageActivityIndicator.createFollowedListEntry({
        //         creator: payload.creator,
        //         entryTitle: payload.entryTitle,
        //         followedList: payload.sharedList,
        //         normalizedPageUrl: payload.normalizedPageUrl,
        //         createdWhen: opts?.now,
        //         updatedWhen: opts?.now,
        //     })
        // } else if (payload.type === 'deletePageListEntry') {
        //     await bgModules.pageActivityIndicator.deleteFollowedListEntry({
        //         normalizedPageUrl: payload.normalizedPageUrl,
        //         followedList: payload.sharedList,
        //     })
        // } else if (payload.type === 'createFirstAnnotationListEntry') {
        //     await bgModules.pageActivityIndicator.updateFollowedListEntryHasAnnotations(
        //         {
        //             normalizedPageUrl: payload.normalizedPageUrl,
        //             followedList: payload.sharedList,
        //             updatedWhen: opts?.now,
        //             hasAnnotations: true,
        //         },
        //     )
        // } else if (payload.type === 'deleteLastAnnotationListEntry') {
        //     await bgModules.pageActivityIndicator.updateFollowedListEntryHasAnnotations(
        //         {
        //             normalizedPageUrl: payload.normalizedPageUrl,
        //             followedList: payload.sharedList,
        //             updatedWhen: opts?.now,
        //             hasAnnotations: false,
        //         },
        //     )
        // } else if (payload.type === 'followList') {
        // } else if (payload.type === 'unfollowList') {
        //     await bgModules.pageActivityIndicator.deleteFollowedListAndAllEntries(
        //         { sharedList: payload.sharedList },
        //     )
        // }
    }
}
