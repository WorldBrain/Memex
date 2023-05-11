import { UILogic, UIEvent, UIEventHandler, UIMutation } from 'ui-logic-core'
import { executeUITask, loadInitial } from 'src/util/ui-logic'
import type { RemoteCollectionsInterface } from 'src/custom-lists/background/types'
import type { TaskState } from 'ui-logic-core/lib/types'
import type { InviteLink } from '@worldbrain/memex-common/lib/content-sharing/ui/list-share-modal/types'
import type { ContentSharingInterface } from 'src/content-sharing/background/types'
import type { UnifiedList } from 'src/annotations/cache/types'
import {
    getListShareUrl,
    getSinglePageShareUrl,
} from 'src/content-sharing/utils'
import { SharedListRoleID } from '@worldbrain/memex-common/lib/content-sharing/types'

export interface Dependencies {
    contentSharingBG: ContentSharingInterface
    spacesBG: RemoteCollectionsInterface
    listData: UnifiedList
    errorMessage?: string
    loadOwnershipData?: boolean
    onCancelEdit?: () => void
    onSpaceShare?: (remoteListId: string) => void
    copyToClipboard: (text: string) => Promise<boolean>
    onSpaceNameChange?: (newName: string) => void
    onConfirmSpaceNameEdit: (newName: string) => void
    onDeleteSpaceIntent?: React.MouseEventHandler
    onDeleteSpaceConfirm?: React.MouseEventHandler
}

export type Event = UIEvent<{
    shareSpace: null
    cancelSpaceNameEdit: null
    confirmSpaceNameEdit: null
    updateSpaceName: { name: string }
    copyInviteLink: { linkIndex: number }
    confirmSpaceDelete: { reactEvent: React.MouseEvent }
    intendToDeleteSpace: { reactEvent: React.MouseEvent }
    cancelDeleteSpace: null
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
        nameValue: this.dependencies.listData.name,
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
        const { listData, spacesBG } = this.dependencies
        const mutation: UIMutation<State> = {}

        await executeUITask(this, 'ownershipLoadState', async () => {
            if (listData.remoteId == null) {
                mutation.mode = { $set: null }
                return
            }

            // TODO: maybe remove this call
            const listDataWithOwnership = await spacesBG.fetchSharedListDataWithOwnership(
                {
                    remoteListId: listData.remoteId,
                },
            )
            if (listData == null) {
                throw new Error('Remote list data not found')
            }

            mutation.mode = {
                $set: listDataWithOwnership.isOwned ? null : 'followed-space',
            }
        })

        this.emitMutation(mutation)
        return this.withMutation(previousState, mutation)
    }

    private async loadInviteLinks() {
        const { listData, contentSharingBG } = this.dependencies

        await executeUITask(this, 'inviteLinksLoadState', async () => {
            if (listData.remoteId == null) {
                return
            }

            // TODO: improve this endpoint so it can work with page-links, or just make it return IDs instead of links
            const { links } = await contentSharingBG.getExistingKeyLinksForList(
                {
                    listReference: {
                        id: listData.remoteId,
                        type: 'shared-list-reference',
                    },
                },
            )

            const contribLink = links.find((link) => link.keyString != null)

            const inviteLinks: InviteLink[] = [
                {
                    roleID: SharedListRoleID.Commenter,
                    link:
                        listData.type === 'page-link'
                            ? getSinglePageShareUrl({
                                  remoteListId: listData.remoteId,
                                  remoteListEntryId: listData.sharedListEntryId,
                              })
                            : getListShareUrl({
                                  remoteListId: listData.remoteId,
                              }),
                },
            ]
            if (contribLink) {
                inviteLinks.push({
                    roleID: SharedListRoleID.ReadWrite,
                    link:
                        listData.type === 'page-link'
                            ? getSinglePageShareUrl({
                                  remoteListId: listData.remoteId,
                                  remoteListEntryId: listData.sharedListEntryId,
                                  collaborationKey: contribLink.keyString,
                              })
                            : getListShareUrl({
                                  remoteListId: listData.remoteId,
                                  collaborationKey: contribLink.keyString,
                              }),
                })
            }

            this.emitMutation({ inviteLinks: { $set: inviteLinks } })
        })
    }

    shareSpace: EventHandler<'shareSpace'> = async ({}) => {
        const {
            listData,
            onSpaceShare,
            copyToClipboard,
            contentSharingBG,
        } = this.dependencies

        let remoteListId = listData.remoteId

        await executeUITask(this, 'inviteLinksLoadState', async () => {
            const shareResult = await contentSharingBG.shareList({
                localListId: listData.localId,
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

    confirmSpaceDelete: EventHandler<'confirmSpaceDelete'> = async ({
        event,
    }) => {
        const { listData } = this.dependencies
        if (!listData.localId) {
            return
        }
        this.dependencies.onDeleteSpaceConfirm?.(event.reactEvent)
        await this.dependencies.spacesBG.removeList({ id: listData.localId })
    }

    intendToDeleteSpace: EventHandler<'intendToDeleteSpace'> = async ({
        event,
    }) => {
        if (this.dependencies.onDeleteSpaceIntent) {
            this.dependencies.onDeleteSpaceIntent(event.reactEvent)
            return
        }
        this.emitMutation({ mode: { $set: 'confirm-space-delete' } })
    }

    cancelDeleteSpace: EventHandler<'cancelDeleteSpace'> = async ({}) => {
        this.emitMutation({ mode: { $set: null } })
    }

    updateSpaceName: EventHandler<'updateSpaceName'> = async ({ event }) => {
        this.dependencies.onSpaceNameChange?.(event.name)
        this.emitMutation({
            nameValue: { $set: event.name },
            showSaveButton: { $set: true },
        })
    }

    cancelSpaceNameEdit: EventHandler<'cancelSpaceNameEdit'> = async ({}) => {
        this.dependencies.onCancelEdit?.()
    }

    confirmSpaceNameEdit: EventHandler<'confirmSpaceNameEdit'> = async ({
        event,
        previousState,
    }) => {
        const oldName = this.dependencies.listData.name
        const newName = previousState.nameValue.trim()
        this.emitMutation({ showSaveButton: { $set: false } })

        if (newName.length && newName !== oldName) {
            this.dependencies.onConfirmSpaceNameEdit(newName)
            await this.dependencies.spacesBG.updateListName({
                id: this.dependencies.listData.localId,
                oldName,
                newName,
            })
        }
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
