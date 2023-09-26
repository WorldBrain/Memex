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
import {
    SharedListEmailInvite,
    SharedListRoleID,
} from '@worldbrain/memex-common/lib/content-sharing/types'
import { trackCopyInviteLink } from '@worldbrain/memex-common/lib/analytics/events'
import type { AnalyticsCoreInterface } from '@worldbrain/memex-common/lib/analytics/types'
import type { AutoPk } from '@worldbrain/memex-common/lib/storage/types'
import {
    NormalizedState,
    initNormalizedState,
} from '@worldbrain/memex-common/lib/common-ui/utils/normalized-state'

export interface Dependencies {
    contentSharingBG: ContentSharingInterface
    spacesBG: RemoteCollectionsInterface
    listData: UnifiedList
    isCreator: boolean
    errorMessage?: string
    loadOwnershipData?: boolean
    onCancelEdit?: () => void
    onSpaceShare?: (
        remoteListId: AutoPk,
        annotationLocalToRemoteIdsDict: { [localId: string]: AutoPk },
    ) => void
    copyToClipboard: (text: string) => Promise<boolean>
    onSpaceNameChange?: (newName: string) => void
    onConfirmSpaceNameEdit: (name: string) => void
    onSetSpacePrivate: (isPrivate: boolean) => void
    onDeleteSpaceIntent?: React.MouseEventHandler
    onDeleteSpaceConfirm?: React.MouseEventHandler
    analyticsBG: AnalyticsCoreInterface
}

export type Event = UIEvent<{
    shareSpace: null
    cancelSpaceNameEdit: null
    confirmSpaceNameEdit: null
    updateSpaceName: { name: string }
    updateEmailInviteInputValue: { value: string }
    updateEmailInviteInputRole: {
        role: SharedListRoleID.Commenter | SharedListRoleID.ReadWrite
    }
    inviteViaEmail: { now?: number }
    deleteEmailInvite: { key: string }
    copyInviteLink: { linkIndex: number; linkType: 'page-link' | 'space-link' }
    confirmSpaceDelete: { reactEvent: React.MouseEvent }
    intendToDeleteSpace: { reactEvent: React.MouseEvent }
    cancelDeleteSpace: null
}>

export interface State {
    loadState: TaskState
    ownershipLoadState: TaskState
    listShareLoadState: TaskState
    inviteLinksLoadState: TaskState
    emailInvitesLoadState: TaskState
    emailInvitesCreateState: TaskState
    emailInvitesDeleteState: TaskState
    emailInviteInputRole:
        | SharedListRoleID.Commenter
        | SharedListRoleID.ReadWrite
    emailInviteInputValue: string
    emailInvites: NormalizedState<
        SharedListEmailInvite & {
            id: AutoPk
            sharedListKey: AutoPk
            roleID: SharedListRoleID
        }
    >
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
        listShareLoadState: 'pristine',
        inviteLinksLoadState: 'pristine',
        emailInvitesLoadState: 'pristine',
        emailInvitesCreateState: 'pristine',
        emailInvitesDeleteState: 'pristine',
        emailInviteInputRole: SharedListRoleID.Commenter,
        emailInviteInputValue: '',
        emailInvites: initNormalizedState(),
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

            // If my own list, load collab links and potential email invite links
            if (state.mode !== 'followed-space') {
                await Promise.all([
                    this.loadInviteLinks(),
                    this.dependencies.listData.isPrivate
                        ? this.loadEmailInvites()
                        : Promise.resolve(),
                ])
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

    private async loadEmailInvites() {
        const { listData, contentSharingBG } = this.dependencies

        await executeUITask(this, 'emailInvitesLoadState', async () => {
            if (listData.remoteId == null) {
                return
            }

            const emailInvites = await contentSharingBG.loadListEmailInvites({
                listReference: {
                    type: 'shared-list-reference',
                    id: listData.remoteId,
                },
            })
            if (emailInvites.status !== 'success') {
                throw new Error('Failed to load email invites for list')
            }
            this.emitMutation({
                emailInvites: {
                    $set: initNormalizedState({
                        seedData: emailInvites.data,
                        getId: (invite) => invite.sharedListKey.toString(),
                    }),
                },
            })
        })
    }

    private async loadInviteLinks() {
        const { listData, contentSharingBG } = this.dependencies

        const createListLink = (collaborationKey?: string): string =>
            listData.type === 'page-link'
                ? getSinglePageShareUrl({
                      collaborationKey,
                      remoteListId: listData.remoteId,
                      remoteListEntryId: listData.sharedListEntryId,
                  })
                : getListShareUrl({
                      collaborationKey,
                      remoteListId: listData.remoteId,
                  })

        await executeUITask(this, 'inviteLinksLoadState', async () => {
            if (listData.remoteId == null) {
                return
            }

            if (listData.collabKey != null) {
                this.emitMutation({
                    inviteLinks: {
                        $set: [
                            {
                                roleID: SharedListRoleID.Commenter,
                                link: createListLink(),
                            },
                            {
                                roleID: SharedListRoleID.ReadWrite,
                                link: createListLink(listData.collabKey),
                            },
                        ],
                    },
                })
                return
            }

            // TODO: Remove all this logic once full support for list's `collabKey` is in the cache
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
                    link: createListLink(),
                },
            ]
            if (contribLink) {
                inviteLinks.push({
                    roleID: SharedListRoleID.ReadWrite,
                    link: createListLink(contribLink.keyString),
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
            const shareResult = await contentSharingBG.scheduleListShare({
                localListId: listData.localId,
            })
            remoteListId = shareResult.remoteListId
            onSpaceShare?.(
                remoteListId,
                shareResult.annotationLocalToRemoteIdsDict,
            )

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

        await executeUITask(this, 'listShareLoadState', async () => {
            await contentSharingBG.waitForListShare({
                localListId: listData.localId,
            })
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

    updateEmailInviteInputValue: EventHandler<
        'updateEmailInviteInputValue'
    > = async ({ event }) => {
        this.emitMutation({ emailInviteInputValue: { $set: event.value } })
    }

    updateEmailInviteInputRole: EventHandler<
        'updateEmailInviteInputRole'
    > = async ({ event }) => {
        this.emitMutation({ emailInviteInputRole: { $set: event.role } })
    }

    inviteViaEmail: EventHandler<'inviteViaEmail'> = async ({
        event,
        previousState,
    }) => {
        const now = event.now ?? Date.now()
        const email = previousState.emailInviteInputValue.trim()
        const roleID = previousState.emailInviteInputRole

        const prevInviteCount = previousState.emailInvites.allIds.length
        const tmpId = `tmp-invite-id-${prevInviteCount}`
        this.emitMutation({
            emailInviteInputValue: { $set: '' },
            emailInvites: {
                allIds: { $push: [tmpId] },
                byId: {
                    [tmpId]: {
                        $set: {
                            email,
                            roleID,
                            id: tmpId,
                            createdWhen: now,
                            sharedListKey: null,
                        },
                    },
                },
            },
        })
        await executeUITask(this, 'emailInvitesCreateState', async () => {
            const result = await this.dependencies.contentSharingBG.createListEmailInvite(
                {
                    now,
                    email,
                    roleID,
                    listId: this.dependencies.listData.remoteId,
                },
            )
            if (result.status === 'success') {
                // Replace temp emailInvites state with the full one
                this.emitMutation({
                    emailInvites: {
                        allIds: {
                            [prevInviteCount]: { $set: result.keyString },
                        },
                        byId: {
                            $unset: [tmpId],
                            [result.keyString]: {
                                $set: {
                                    email,
                                    roleID,
                                    createdWhen: now,
                                    id: result.keyString,
                                    sharedListKey: result.keyString,
                                },
                            },
                        },
                    },
                })
            } else if (result.status === 'permission-denied') {
                this.emitMutation({
                    emailInvites: {
                        byId: { $unset: [tmpId] },
                        allIds: {
                            $apply: (prev) =>
                                prev.filter((ids) => ids !== tmpId),
                        },
                    },
                })
                throw new Error('Email invite encountered an error')
            }
        })
    }

    deleteEmailInvite: EventHandler<'deleteEmailInvite'> = async ({
        event,
        previousState,
    }) => {
        await executeUITask(this, 'emailInvitesDeleteState', async () => {
            if (previousState.emailInvites.byId[event.key] == null) {
                throw new Error(
                    'Attempted to delete email invite that is not in state',
                )
            }

            this.emitMutation({
                emailInvites: {
                    byId: { $unset: [event.key] },
                    allIds: {
                        $apply: (prev) =>
                            prev.filter((ids) => ids !== event.key),
                    },
                },
            })
            const result = await this.dependencies.contentSharingBG.deleteListEmailInvite(
                {
                    keyString: event.key,
                },
            )
            if (result.status !== 'success') {
                throw new Error(
                    'Email invite deletion encountered a server-side error',
                )
            }
        })
    }

    cancelSpaceNameEdit: EventHandler<'cancelSpaceNameEdit'> = async ({}) => {
        this.dependencies.onCancelEdit?.()
    }

    confirmSpaceNameEdit: EventHandler<'confirmSpaceNameEdit'> = ({
        event,
        previousState,
    }) => {
        const oldName = this.dependencies.listData.name
        const newName = previousState.nameValue.trim()
        this.emitMutation({ showSaveButton: { $set: false } })

        if (newName.length && newName !== oldName) {
            this.dependencies.onConfirmSpaceNameEdit(newName)
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

        if (this.dependencies.analyticsBG) {
            try {
                trackCopyInviteLink(this.dependencies.analyticsBG, {
                    inviteType:
                        event.linkIndex === 0 ? 'reader' : 'contributer',
                    linkType:
                        event.linkType === 'page-link'
                            ? 'page-link'
                            : 'space-link',
                    source: 'extension',
                })
            } catch (error) {
                console.error(`Error tracking space create event', ${error}`)
            }
        }

        setTimeout(
            () => showInviteLinkCopyMsg(false),
            SpaceContextMenuLogic.MSG_TIMEOUT,
        )
    }
}
