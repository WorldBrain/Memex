import { UILogic, UIEvent, UIEventHandler, UIMutation } from 'ui-logic-core'
import { executeUITask, loadInitial } from 'src/util/ui-logic'
import type { TaskState } from 'ui-logic-core/lib/types'
import type { ContentSharingInterface } from 'src/content-sharing/background/types'
import type { UnifiedList } from 'src/annotations/cache/types'
import type { AnalyticsCoreInterface } from '@worldbrain/memex-common/lib/analytics/types'
import type { InviteLink } from '@worldbrain/memex-common/lib/content-sharing/ui/list-share-modal/types'
import {
    getListShareUrl,
    getSinglePageShareUrl,
} from 'src/content-sharing/utils'
import { SharedListRoleID } from '@worldbrain/memex-common/lib/content-sharing/types'

export interface Dependencies {
    analyticsBG: AnalyticsCoreInterface
    contentSharingBG: ContentSharingInterface
    listData: UnifiedList
    isCreator: boolean
    errorMessage?: string
    copyToClipboard: (text: string) => Promise<boolean>
    onSpaceNameChange?: (newName: string) => void
    onConfirmSpaceNameEdit?: (name: string) => void
    onSetSpacePrivate: (isPrivate: boolean) => Promise<void>
}

export type Event = UIEvent<{
    updateSpacePrivacy: { isPrivate: boolean }
    copyInviteLink: { link: string }
}>

export interface State {
    inviteLinks: InviteLink[]
    inviteLinksLoadState: TaskState

    loadState: TaskState
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
            await this.loadInviteLinks()
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

    copyInviteLink: EventHandler<'copyInviteLink'> = async ({ event }) => {
        await this.dependencies.copyToClipboard(event.link)
    }

    updateSpacePrivacy: EventHandler<'updateSpacePrivacy'> = async ({
        event,
    }) => {
        await this.dependencies.onSetSpacePrivate(event.isPrivate)
    }
}
