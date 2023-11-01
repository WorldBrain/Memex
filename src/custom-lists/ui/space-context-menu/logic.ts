import { UILogic, UIEvent, UIEventHandler, UIMutation } from 'ui-logic-core'
import { executeUITask, loadInitial } from 'src/util/ui-logic'
import type { RemoteCollectionsInterface } from 'src/custom-lists/background/types'
import type { TaskState } from 'ui-logic-core/lib/types'
import type { ContentSharingInterface } from 'src/content-sharing/background/types'
import type { UnifiedList } from 'src/annotations/cache/types'
import type { AnalyticsCoreInterface } from '@worldbrain/memex-common/lib/analytics/types'
import type { AutoPk } from '@worldbrain/memex-common/lib/storage/types'
import type { InviteLink } from '@worldbrain/memex-common/lib/content-sharing/ui/list-share-modal/types'
import {
    getListShareUrl,
    getSinglePageShareUrl,
} from 'src/content-sharing/utils'
import { SharedListRoleID } from '@worldbrain/memex-common/lib/content-sharing/types'

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
    onConfirmSpaceNameEdit?: (name: string) => void
    onSetSpacePrivate: (isPrivate: boolean) => Promise<void>
    onDeleteSpaceIntent?: React.MouseEventHandler
    onDeleteSpaceConfirm?: React.MouseEventHandler
    analyticsBG: AnalyticsCoreInterface
}

export type Event = UIEvent<{
    shareSpace: { privacyStatus: 'private' | 'shared' }
    cancelSpaceNameEdit: null
    confirmSpaceNameEdit: null
    updateSpaceName: { name: string }
    updateSpacePrivacy: { isPrivate: boolean }
    confirmSpaceDelete: { reactEvent: React.MouseEvent }
    intendToDeleteSpace: { reactEvent: React.MouseEvent }
    copyInviteLink: { link: string }
    cancelDeleteSpace: null
}>

export interface State {
    inviteLinks: InviteLink[]
    inviteLinksLoadState: TaskState

    loadState: TaskState
    ownershipLoadState: TaskState
    listShareLoadState: TaskState
    showSuccessMsg: boolean
    showSaveButton: boolean
    nameValue: string
    mode: 'confirm-space-delete' | 'followed-space' | null
    isLocalPDF: boolean
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
        inviteLinks: [],
        nameValue: this.dependencies.listData.name,
        showSuccessMsg: false,
        mode: null,
        showSaveButton: false,
        isLocalPDF: false,
    })

    init: EventHandler<'init'> = async ({ previousState }) => {
        if (window.location.href.includes('/pdfjs/viewer.html?file=blob')) {
            this.emitMutation({
                isLocalPDF: { $set: true },
            })
        }

        await loadInitial(this, async () => {
            if (this.dependencies.listData.remoteId == null) {
                await this._shareSpace('private')
            }
            await this.loadInviteLinks()
            if (this.dependencies.loadOwnershipData) {
                await this.loadSpaceOwnership()
            }
        })
    }

    private async loadSpaceOwnership() {
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
                $set: listDataWithOwnership?.isOwned ? null : 'followed-space',
            }
        })

        this.emitMutation(mutation)
    }

    private async loadInviteLinks() {
        const { listData, contentSharingBG } = this.dependencies

        while (listData.remoteId == null) {
            await new Promise((resolve) => setTimeout(resolve, 50))
        }

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
            if (listData?.remoteId == null) {
                return
            }

            if (listData?.collabKey != null) {
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

    copyInviteLink: EventHandler<'copyInviteLink'> = async ({
        previousState,
        event,
    }) => {
        await this.dependencies.copyToClipboard(event.link)
    }

    shareSpace: EventHandler<'shareSpace'> = async ({ event }) => {
        await this._shareSpace(event.privacyStatus)
    }

    private async _shareSpace(privacyStatus: 'private' | 'shared') {
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

            if (privacyStatus === 'private') {
                await this.dependencies.onSetSpacePrivate(true)
            }

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
            if (privacyStatus === 'private') {
                await this.dependencies.onSetSpacePrivate(true)
            }
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
        await this.dependencies.contentSharingBG.deleteListAndAllAssociatedData(
            { localListId: listData.localId },
        )
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

    updateSpacePrivacy: EventHandler<'updateSpacePrivacy'> = async ({
        event,
        previousState,
    }) => {
        await this.dependencies.onSetSpacePrivate(event.isPrivate)
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
}
