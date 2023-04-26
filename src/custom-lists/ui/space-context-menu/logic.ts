import { UILogic, UIEvent, UIEventHandler, UIMutation } from 'ui-logic-core'
import { executeUITask, loadInitial } from 'src/util/ui-logic'
import type { RemoteCollectionsInterface } from 'src/custom-lists/background/types'
import type { TaskState } from 'ui-logic-core/lib/types'
import type { InviteLink } from '@worldbrain/memex-common/lib/content-sharing/ui/list-share-modal/types'
import type { ContentSharingInterface } from 'src/content-sharing/background/types'

export interface Dependencies {
    contentSharingBG: ContentSharingInterface
    spacesBG: RemoteCollectionsInterface
    localListId: number
    remoteListId: string | null
    errorMessage: string | null
    spaceName: string
    loadOwnershipData?: boolean
    onSpaceShare?: (remoteListId: string) => void
    copyToClipboard: (text: string) => Promise<boolean>
}

export type Event = UIEvent<{
    shareSpace: null
    deleteSpace: null
    cancelDeleteSpace: null
    setShowSaveBtn: { show: boolean }
    updateSpaceName: { name: string }
    copyInviteLink: { linkIndex: number }
}>

export interface State {
    loadState: TaskState
    ownershipLoadState: TaskState
    inviteLinksLoadState: TaskState
    inviteLinks: InviteLink[]
    showSuccessMsg: boolean
    mode: 'confirm-space-delete' | 'followed-space' | null
    nameValue: string
    showSaveButton: boolean
}

type EventHandler<EventName extends keyof Event> = UIEventHandler<
    State,
    Event,
    EventName
>

export default class SpaceContextMenuLogic extends UILogic<State, Event> {
    static MSG_TIMEOUT = 2000

    constructor(protected dependencies: Dependencies) {
        super()
    }

    getInitialState = (): State => ({
        loadState: 'pristine',
        ownershipLoadState: 'pristine',
        inviteLinksLoadState: 'pristine',
        inviteLinks: [],
        nameValue: this.dependencies.spaceName,
        showSuccessMsg: false,
        mode: null,
        showSaveButton: false,
    })

    init: EventHandler<'init'> = async ({ previousState }) => {
        let state = previousState
        await loadInitial(this, async () => {
            if (this.dependencies.loadOwnershipData) {
                state = await this.loadSpaceOwnership(previousState)
            }

            if (state.mode !== 'followed-space') {
                await this.loadInviteLinks()
            }
        })
    }

    private async loadSpaceOwnership(previousState: State): Promise<State> {
        const { remoteListId, spacesBG } = this.dependencies
        const mutation: UIMutation<State> = {}

        await executeUITask(this, 'ownershipLoadState', async () => {
            if (remoteListId == null) {
                mutation.mode = { $set: null }
                return
            }

            const listData = await spacesBG.fetchSharedListDataWithOwnership({
                remoteListId,
            })
            if (listData == null) {
                throw new Error('Remote list data not found')
            }

            mutation.mode = { $set: listData.isOwned ? null : 'followed-space' }
        })

        this.emitMutation(mutation)
        return this.withMutation(previousState, mutation)
    }

    private async loadInviteLinks() {
        const { remoteListId, contentSharingBG } = this.dependencies

        await executeUITask(this, 'inviteLinksLoadState', async () => {
            if (remoteListId == null) {
                return
            }

            const { links } = await contentSharingBG.getExistingKeyLinksForList(
                {
                    listReference: {
                        id: remoteListId,
                        type: 'shared-list-reference',
                    },
                },
            )

            if (links.length) {
                this.emitMutation({ inviteLinks: { $set: links } })
            }
        })
    }

    shareSpace: EventHandler<'shareSpace'> = async ({}) => {
        const {
            localListId,
            onSpaceShare,
            copyToClipboard,
            contentSharingBG,
        } = this.dependencies

        let remoteListId = this.dependencies.remoteListId

        await executeUITask(this, 'inviteLinksLoadState', async () => {
            const shareResult = await contentSharingBG.shareList({
                localListId,
            })
            remoteListId = shareResult.remoteListId
            onSpaceShare?.(remoteListId)

            this.emitMutation({
                showSuccessMsg: { $set: true },
                inviteLinks: { $set: shareResult.links },
            })

            const linkToCopy =
                shareResult.links[1]?.link ?? shareResult.links[0]?.link
            if (linkToCopy != null) {
                await copyToClipboard(linkToCopy)
            }
        })

        setTimeout(
            () => this.emitMutation({ showSuccessMsg: { $set: false } }),
            SpaceContextMenuLogic.MSG_TIMEOUT,
        )
    }

    deleteSpace: EventHandler<'deleteSpace'> = async ({}) => {
        this.emitMutation({ mode: { $set: 'confirm-space-delete' } })
    }

    cancelDeleteSpace: EventHandler<'cancelDeleteSpace'> = async ({}) => {
        this.emitMutation({ mode: { $set: null } })
    }

    updateSpaceName: EventHandler<'updateSpaceName'> = async ({
        previousState,
        event,
    }) => {
        this.emitMutation({
            nameValue: { $set: event.name },
            showSaveButton: { $set: true },
        })
    }

    setShowSaveBtn: EventHandler<'setShowSaveBtn'> = async ({ event }) => {
        this.emitMutation({ showSaveButton: { $set: event.show } })
    }

    copyInviteLink: EventHandler<'copyInviteLink'> = async ({
        previousState,
        event,
    }) => {
        const inviteLink = previousState.inviteLinks[event.linkIndex]
        if (inviteLink == null) {
            throw new Error('Link to copy does not exist - cannot copy')
        }

        await this.dependencies.copyToClipboard(inviteLink.link)

        const showInviteLinkCopyMsg = (showCopyMsg: boolean) =>
            this.emitMutation({
                inviteLinks: {
                    [event.linkIndex]: {
                        showCopyMsg: { $set: showCopyMsg },
                    },
                },
            })

        showInviteLinkCopyMsg(true)

        setTimeout(
            () => showInviteLinkCopyMsg(false),
            SpaceContextMenuLogic.MSG_TIMEOUT,
        )
    }
}
