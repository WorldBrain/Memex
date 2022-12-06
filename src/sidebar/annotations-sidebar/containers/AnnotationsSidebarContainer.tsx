import * as React from 'react'
import styled, { ThemeProvider, css } from 'styled-components'
import { createGlobalStyle } from 'styled-components'

import { StatefulUIElement } from 'src/util/ui-logic'
import AnnotationsSidebar, {
    AnnotationsSidebar as AnnotationsSidebarComponent,
    AnnotationsSidebarProps,
} from '../components/AnnotationsSidebar'
import {
    SidebarContainerLogic,
    SidebarContainerOptions,
    INIT_FORM_STATE,
} from './logic'
import classNames from 'classnames'

import type {
    SidebarContainerState,
    SidebarContainerEvents,
    AnnotationEventContext,
} from './types'
import { ConfirmModal } from 'src/common-ui/components'
import { TooltipBox } from '@worldbrain/memex-common/lib/common-ui/components/tooltip-box'
import type { AnnotationFooterEventProps } from 'src/annotations/components/AnnotationFooter'
import type { Annotation, ListDetailsGetter } from 'src/annotations/types'
import {
    AnnotationEditEventProps,
    AnnotationEditGeneralProps,
} from 'src/annotations/components/AnnotationEdit'
import { HoverBox } from 'src/common-ui/components/design-library/HoverBox'
import * as icons from 'src/common-ui/components/design-library/icons'
import SingleNoteShareMenu from 'src/overview/sharing/SingleNoteShareMenu'
import { PageNotesCopyPaster } from 'src/copy-paster'
import { normalizeUrl } from '@worldbrain/memex-url-utils'
import { copyToClipboard } from 'src/annotations/content_script/utils'
import analytics from 'src/analytics'
import type { PickerUpdateHandler } from 'src/common-ui/GenericPicker/types'
import { getListShareUrl } from 'src/content-sharing/utils'
import { Rnd } from 'react-rnd'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import type { SpacePickerDependencies } from 'src/custom-lists/ui/CollectionPicker/logic'
import CollectionPicker from 'src/custom-lists/ui/CollectionPicker'
import { SIDEBAR_WIDTH_STORAGE_KEY } from '../constants'
import ConfirmDialog from 'src/common-ui/components/ConfirmDialog'
import {
    PRIVATIZE_ANNOT_MSG,
    SELECT_SPACE_ANNOT_MSG,
    SELECT_SPACE_ANNOT_SUBTITLE,
    PRIVATIZE_ANNOT_AFFIRM_LABEL,
    PRIVATIZE_ANNOT_NEGATIVE_LABEL,
    SELECT_SPACE_NEGATIVE_LABEL,
    SELECT_SPACE_AFFIRM_LABEL,
} from 'src/overview/sharing/constants'
import { PopoutBox } from '@worldbrain/memex-common/lib/common-ui/components/popout-box'
import { SIDEBAR_DEFAULT_OPTION } from 'src/sidebar-overlay/constants'

const DEF_CONTEXT: { context: AnnotationEventContext } = {
    context: 'pageAnnotations',
}

export interface Props extends SidebarContainerOptions {
    skipTopBarRender?: boolean
    isLockable?: boolean
    setSidebarWidthforDashboard?: (sidebarWidth) => void
    onNotesSidebarClose?: () => void
}

export class AnnotationsSidebarContainer<
    P extends Props = Props
> extends StatefulUIElement<P, SidebarContainerState, SidebarContainerEvents> {
    private sidebarRef = React.createRef<AnnotationsSidebarComponent>()
    private shareButtonRef = React.createRef<HTMLElement>()
    private spacePickerButtonRef = React.createRef<HTMLElement>()

    constructor(props: P) {
        super(
            props,
            new SidebarContainerLogic({
                ...props,
                analytics,
                copyToClipboard,
                focusCreateForm: () =>
                    (this.sidebarRef?.current[
                        'instanceRef'
                    ] as AnnotationsSidebarComponent).focusCreateForm(),
                focusEditNoteForm: (annotationId) => {
                    ;(this.sidebarRef?.current[
                        'instanceRef'
                    ] as AnnotationsSidebarComponent).focusEditNoteForm(
                        annotationId,
                    )
                },
            }),
        )
        this.listenToWindowChanges()
    }

    listenToWindowChanges() {
        window.addEventListener('resize', () => {
            if (this.state.isWidthLocked) {
                this.processEvent('adjustSidebarWidth', {
                    newWidth: this.state.sidebarWidth,
                    isWidthLocked: true,
                })
            }
        })
    }

    private createNewList = async (name: string) => {
        const listId = await this.props.customLists.createCustomList({
            name,
        })
        this.props.annotationsCache.addNewListData({
            name,
            id: listId,
            remoteId: null,
        })
        return listId
    }

    private getListDetailsById: ListDetailsGetter = (listId) => {
        const { annotationsCache } = this.props
        return {
            name: annotationsCache.listData[listId]?.name ?? 'Missing list',
            isShared: annotationsCache.listData[listId]?.remoteId != null,
        }
    }

    listenToEsc = (event) => {
        if (event.key === 'Escape') {
            if (
                this.state.showAllNotesCopyPaster ||
                this.state.showAllNotesShareMenu ||
                this.state.activeListPickerState ||
                this.state.showAnnotationsShareModal ||
                this.state.activeShareMenuNoteId ||
                this.state.popoutsActive
            ) {
                return
            } else {
                this.hideSidebar()
            }
        }
    }
    toggleSidebarShowForPageId(pageId: string) {
        const isAlreadyOpenForOtherPage = pageId !== this.state.pageUrl

        document.addEventListener('keydown', this.listenToEsc, true)

        if (this.state.showState === 'hidden' || isAlreadyOpenForOtherPage) {
            this.setPageUrl(pageId)

            this.showSidebar()
        } else if (this.state.showState === 'visible') {
            this.hideSidebar()
        }
    }

    showSidebar() {
        this.processEvent('show', {
            existingWidthState: this.state.sidebarWidth
                ? this.state.sidebarWidth
                : SIDEBAR_WIDTH_STORAGE_KEY,
        })

        if (this.props.sidebarContext === 'dashboard') {
            setTimeout(() => {
                this.props.setSidebarWidthforDashboard(
                    this.state.sidebarWidth || SIDEBAR_WIDTH_STORAGE_KEY,
                )
            }, 0)
        }

        if (
            this.state.isWidthLocked ||
            this.props.sidebarContext === 'dashboard'
        ) {
            this.processEvent('adjustSidebarWidth', {
                newWidth: this.state.sidebarWidth,
                isWidthLocked: true,
            })
        }
    }

    hideSidebar() {
        document.removeEventListener('keydown', this.listenToEsc, true)
        this.processEvent('hide', null)

        if (this.props.sidebarContext === 'dashboard') {
            setTimeout(() => {
                this.props.setSidebarWidthforDashboard('0px')
                this.props.onNotesSidebarClose()
            }, 50)
        }
    }

    toggleSidebarLock = () =>
        this.processEvent(this.state.isLocked ? 'unlock' : 'lock', null)

    toggleSidebarWidthLock = () => {
        this.processEvent(
            this.state.isWidthLocked ? 'unlockWidth' : 'lockWidth',
            null,
        )

        if (!this.state.isWidthLocked) {
            this.processEvent('adjustSidebarWidth', {
                newWidth: this.state.sidebarWidth
                    ? this.state.sidebarWidth
                    : SIDEBAR_WIDTH_STORAGE_KEY,
                isWidthLocked: true,
            })
        }
    }

    setPageUrl = (pageUrl: string) => {
        this.processEvent('setPageUrl', { pageUrl })
    }

    private handleClickOutside = (e) => {
        if (this.state.isLocked) {
            return
        }

        if (this.props.onClickOutside) {
            return this.props.onClickOutside(e)
        }

        // Do not close the sidebar if clicked on a highlight in the page
        if (e.target?.dataset?.annotation) {
            return
        }

        if (
            this.state.showState === 'visible' &&
            this.props.sidebarContext !== 'dashboard'
        ) {
            this.hideSidebar()
        }
    }

    protected bindAnnotationFooterEventProps(
        annotation: Pick<Annotation, 'url' | 'body'>,
        /** This needs to be defined for footer events for annots in followed lists states  */
        followedListId?: string,
    ): AnnotationFooterEventProps & {
        onGoToAnnotation?: React.MouseEventHandler
    } {
        return {
            onEditIconClick: () =>
                this.processEvent('setAnnotationEditMode', {
                    annotationUrl: annotation.url,
                    followedListId,
                    ...DEF_CONTEXT,
                }),
            onDeleteIconClick: () =>
                this.processEvent('switchAnnotationMode', {
                    annotationUrl: annotation.url,
                    followedListId,
                    mode: 'delete',
                    ...DEF_CONTEXT,
                }),
            onDeleteCancel: () =>
                this.processEvent('switchAnnotationMode', {
                    annotationUrl: annotation.url,
                    followedListId,
                    mode: 'default',
                    ...DEF_CONTEXT,
                }),
            onDeleteConfirm: () =>
                this.processEvent('deleteAnnotation', {
                    annotationUrl: annotation.url,
                    ...DEF_CONTEXT,
                }),
            onShareClick: (mouseEvent) =>
                this.processEvent('shareAnnotation', {
                    annotationUrl: annotation.url,
                    ...DEF_CONTEXT,
                    followedListId,
                    mouseEvent,
                }),
            onGoToAnnotation:
                this.props.showGoToAnnotationBtn && annotation.body?.length > 0
                    ? () =>
                          this.processEvent('goToAnnotationInNewTab', {
                              annotationUrl: annotation.url,
                              ...DEF_CONTEXT,
                          })
                    : undefined,
            onCopyPasterBtnClick: () =>
                this.processEvent('setCopyPasterAnnotationId', {
                    id: annotation.url,
                    followedListId,
                }),
            onTagIconClick: () =>
                this.processEvent('setTagPickerAnnotationId', {
                    id: annotation.url,
                }),
            // onListIconClick: () =>
            //     this.processEvent('setListPickerAnnotationId', {
            //         id: annotation.url,
            //         position: 'footer',
            //         followedListId,
            //     }),
        }
    }

    protected bindAnnotationEditProps = (
        annotation: Pick<Annotation, 'url' | 'isShared'>,
        /** This needs to be defined for footer events for annots in followed lists states  */
        followedListId?: string,
    ): AnnotationEditEventProps & AnnotationEditGeneralProps => {
        const { editForms } = this.state
        // Should only ever be undefined for a moment, between creating a new annot state and
        //  the time it takes for the BG method to return the generated PK
        const form = editForms[annotation.url] ?? { ...INIT_FORM_STATE }

        return {
            comment: form.commentText,
            onListsBarPickerBtnClick: () =>
                this.processEvent('setListPickerAnnotationId', {
                    id: annotation.url,
                    position: 'lists-bar',
                    followedListId,
                }),
            onCommentChange: (comment) =>
                this.processEvent('changeEditCommentText', {
                    annotationUrl: annotation.url,
                    comment,
                }),
            onEditConfirm: (showExternalConfirmations) => (
                shouldShare,
                isProtected,
                opts,
            ) => {
                const showConfirmation =
                    showExternalConfirmations &&
                    annotation.isShared &&
                    !shouldShare
                return this.processEvent(
                    showConfirmation
                        ? 'setPrivatizeNoteConfirmArgs'
                        : 'editAnnotation',
                    {
                        annotationUrl: annotation.url,
                        shouldShare,
                        isProtected,
                        mainBtnPressed: opts?.mainBtnPressed,
                        keepListsIfUnsharing: opts?.keepListsIfUnsharing,
                        ...DEF_CONTEXT,
                    },
                )
            },
            onEditCancel: () =>
                this.processEvent('cancelEdit', {
                    annotationUrl: annotation.url,
                }),
        }
    }

    protected getCreateProps(): AnnotationsSidebarProps['annotationCreateProps'] {
        const { tags, customLists, contentSharing } = this.props
        return {
            onCommentChange: (comment) =>
                this.processEvent('changeNewPageCommentText', { comment }),
            onTagsUpdate: (tags) =>
                this.processEvent('updateNewPageCommentTags', { tags }),
            onCancel: () => this.processEvent('cancelNewPageComment', null),
            onSave: (shouldShare, isProtected) =>
                this.processEvent('saveNewPageComment', {
                    shouldShare,
                    isProtected,
                }),
            tagQueryEntries: (query) => tags.searchForTagSuggestions({ query }),
            addPageToList: (listId) =>
                this.processEvent('updateNewPageCommentLists', {
                    lists: [...this.state.commentBox.lists, listId],
                }),
            removePageFromList: (listId) =>
                this.processEvent('updateNewPageCommentLists', {
                    lists: this.state.commentBox.lists.filter(
                        (id) => id !== listId,
                    ),
                }),
            getListDetailsById: this.getListDetailsById,
            createNewList: this.createNewList,
            contentSharingBG: contentSharing,
            spacesBG: customLists,
            loadDefaultTagSuggestions: tags.fetchInitialTagSuggestions,
            comment: this.state.commentBox.commentText,
            tags: this.state.commentBox.tags,
            lists: this.state.commentBox.lists,
            hoverState: null,
        }
    }

    private handleTagsUpdate = (url: string): PickerUpdateHandler => async ({
        added,
        deleted,
    }) => {
        const annot = this.props.annotationsCache.getAnnotationById(url)
        const newTags = added
            ? [...annot.tags, added]
            : annot.tags.filter((tag) => tag !== deleted)

        await this.props.annotationsCache.update({ ...annot, tags: newTags })
    }

    private handleCopyAllNotesClick: React.MouseEventHandler = (e) => {
        e.preventDefault()

        this.processEvent('setAllNotesCopyPasterShown', {
            shown: !this.state.showAllNotesCopyPaster,
        })
    }

    private getSpacePickerProps = (
        annotation: Annotation,
        showExternalConfirmations?: boolean,
    ): SpacePickerDependencies => {
        const { annotationsCache, customLists, contentSharing } = this.props
        // This is to show confirmation modal if the annotation is public and the user is trying to add it to a shared space
        const getUpdateListsEvent = (listId: number) =>
            annotation.isShared &&
            annotationsCache.listData[listId]?.remoteId != null &&
            showExternalConfirmations
                ? 'setSelectNoteSpaceConfirmArgs'
                : 'updateListsForAnnotation'
        return {
            spacesBG: customLists,
            contentSharingBG: contentSharing,
            createNewEntry: this.createNewList,
            initialSelectedListIds: () => annotation.lists ?? [],
            onSubmit: async () => {
                await this.processEvent('resetListPickerAnnotationId', {})

                if (
                    this.state.annotationModes.pageAnnotations[
                        annotation.url
                    ] === 'edit'
                ) {
                    await this.processEvent('editAnnotation', {
                        annotationUrl: annotation.url,
                        shouldShare: annotation.isShared,
                        isProtected: annotation.isBulkShareProtected,
                        mainBtnPressed: true,
                        ...DEF_CONTEXT,
                    })
                }
            },
            selectEntry: async (listId, options) =>
                this.processEvent(getUpdateListsEvent(listId), {
                    added: listId,
                    deleted: null,
                    annotationId: annotation.url,
                    options,
                }),
            unselectEntry: async (listId) =>
                this.processEvent('updateListsForAnnotation', {
                    added: null,
                    deleted: listId,
                    annotationId: annotation.url,
                }),
        }
    }

    private renderCopyPasterManagerForAnnotation = (
        followedListId?: string,
    ) => (currentAnnotationId: string) => {
        // const state =
        //     followedListId != null
        //         ? this.state.followedLists.byId[followedListId]
        //               .activeCopyPasterAnnotationId
        //         : this.state.activeCopyPasterAnnotationId

        // if (state !== currentAnnotationId) {
        //     return null
        // }

        return (
            <PageNotesCopyPaster
                copyPaster={this.props.copyPaster}
                annotationUrls={[currentAnnotationId]}
                normalizedPageUrls={[normalizeUrl(this.state.pageUrl)]}
            />
        )
    }

    private renderListPickerForAnnotation = (followedListId?: string) => (
        currentAnnotationId: string,
    ) => {
        const currentAnnotation = this.props.annotationsCache.getAnnotationById(
            currentAnnotationId,
        )

        // const state =
        //     followedListId != null
        //         ? this.state.followedLists.byId[followedListId]
        //               .activeListPickerState
        //         : this.state.activeListPickerState

        // if (
        //     state == null ||
        //     state.annotationId !== currentAnnotationId ||
        //     currentAnnotation == null
        // ) {
        //     return
        // }

        return (
            <CollectionPicker
                {...this.getSpacePickerProps(currentAnnotation, true)}
            />
        )
    }

    private renderShareMenuForAnnotation = (followedListId?: string) => (
        currentAnnotationId: string,
    ) => {
        const currentAnnotation = this.props.annotationsCache.getAnnotationById(
            currentAnnotationId,
        )

        // const state =
        //     followedListId != null
        //         ? this.state.followedLists.byId[followedListId]
        //               .activeShareMenuAnnotationId
        //         : this.state.activeShareMenuNoteId

        // if (state !== currentAnnotationId || currentAnnotation == null) {
        //     return null
        // }

        return (
            <SingleNoteShareMenu
                listData={this.props.annotationsCache.listData}
                isShared={currentAnnotation.isShared}
                shareImmediately={this.state.immediatelyShareNotes}
                contentSharingBG={this.props.contentSharing}
                annotationsBG={this.props.annotations}
                copyLink={(link) => this.processEvent('copyNoteLink', { link })}
                annotationUrl={currentAnnotationId}
                postShareHook={(state, opts) =>
                    this.processEvent('updateAnnotationShareInfo', {
                        annotationUrl: currentAnnotationId,
                        privacyLevel: state.privacyLevel,
                        keepListsIfUnsharing: opts?.keepListsIfUnsharing,
                    })
                }
                spacePickerProps={this.getSpacePickerProps(currentAnnotation)}
            />
        )
    }

    protected renderModals() {
        const {
            confirmPrivatizeNoteArgs,
            confirmSelectNoteSpaceArgs,
        } = this.state

        return (
            <>
                {confirmPrivatizeNoteArgs && (
                    <ConfirmModal
                        isShown
                        ignoreReactPortal={
                            this.props.sidebarContext !== 'dashboard'
                        }
                        onClose={() =>
                            this.processEvent(
                                'setPrivatizeNoteConfirmArgs',
                                null,
                            )
                        }
                    >
                        <ConfirmDialog
                            titleText={PRIVATIZE_ANNOT_MSG}
                            negativeLabel={PRIVATIZE_ANNOT_NEGATIVE_LABEL}
                            affirmativeLabel={PRIVATIZE_ANNOT_AFFIRM_LABEL}
                            handleConfirmation={(affirmative) => () =>
                                this.processEvent('editAnnotation', {
                                    ...confirmPrivatizeNoteArgs,
                                    keepListsIfUnsharing: !affirmative,
                                })}
                        />
                    </ConfirmModal>
                )}
                {confirmSelectNoteSpaceArgs && (
                    <ConfirmModal
                        isShown
                        ignoreReactPortal={
                            this.props.sidebarContext !== 'dashboard'
                        }
                        onClose={() =>
                            this.processEvent(
                                'setSelectNoteSpaceConfirmArgs',
                                null,
                            )
                        }
                    >
                        <ConfirmDialog
                            titleText={SELECT_SPACE_ANNOT_MSG}
                            subTitleText={SELECT_SPACE_ANNOT_SUBTITLE}
                            affirmativeLabel={SELECT_SPACE_AFFIRM_LABEL}
                            negativeLabel={SELECT_SPACE_NEGATIVE_LABEL}
                            handleConfirmation={(affirmative) => () =>
                                this.processEvent('updateListsForAnnotation', {
                                    ...confirmSelectNoteSpaceArgs,
                                    options: { protectAnnotation: affirmative },
                                })}
                        />
                    </ConfirmModal>
                )}
            </>
        )
    }

    protected renderTopBanner() {
        return null
    }

    private renderTopSideBar() {
        if (this.props.skipTopBarRender) {
            return null
        }

        return (
            <>
                <TopBarActionBtns
                    width={this.state.sidebarWidth}
                    sidebarContext={this.props.sidebarContext}
                >
                    {this.props.sidebarContext !== 'dashboard' && (
                        <TopArea>
                            <IconBoundary>
                                <Icon
                                    heightAndWidth="16px"
                                    filePath={
                                        'heartEmpty'
                                        // this.props.bookmark.isBookmarked
                                        //     ? icons.heartFull
                                        //     : icons.heartEmpty
                                    }
                                />
                            </IconBoundary>
                            <IconBoundary>
                                <Icon
                                    // onClick={() =>
                                    // }
                                    heightAndWidth="16px"
                                    filePath={
                                        'collectionsEmpty'
                                        // this.props.bookmark.isBookmarked
                                        //     ? icons.heartFull
                                        //     : icons.heartEmpty
                                    }
                                />
                            </IconBoundary>
                            <IconBoundary>
                                <Icon
                                    heightAndWidth="16px"
                                    filePath={
                                        'searchIcon'
                                        // this.props.bookmark.isBookmarked
                                        //     ? icons.heartFull
                                        //     : icons.heartEmpty
                                    }
                                />
                            </IconBoundary>
                        </TopArea>
                    )}

                    <BottomArea>
                        {this.props.sidebarContext !== 'dashboard' &&
                            (this.state.isLocked ? (
                                <TooltipBox
                                    tooltipText="Unlock sidebar"
                                    placement="left"
                                >
                                    <IconBoundary>
                                        <Icon
                                            filePath={icons.arrowRight}
                                            heightAndWidth="16px"
                                            onClick={this.toggleSidebarLock}
                                        />
                                    </IconBoundary>
                                </TooltipBox>
                            ) : (
                                <TooltipBox
                                    tooltipText="Lock sidebar open"
                                    placement="left"
                                >
                                    <IconBoundary>
                                        <Icon
                                            filePath={icons.arrowLeft}
                                            heightAndWidth="16px"
                                            onClick={this.toggleSidebarLock}
                                        />
                                    </IconBoundary>
                                </TooltipBox>
                            ))}
                        {this.props.sidebarContext !== 'dashboard' &&
                            (!this.state.isWidthLocked ? (
                                <TooltipBox
                                    tooltipText="Adjust Page Width"
                                    placement="left"
                                >
                                    <IconBoundary>
                                        <Icon
                                            filePath={icons.compress}
                                            heightAndWidth="16px"
                                            onClick={() =>
                                                this.toggleSidebarWidthLock()
                                            }
                                        />
                                    </IconBoundary>
                                </TooltipBox>
                            ) : (
                                <TooltipBox
                                    tooltipText="Full page width"
                                    placement="left"
                                >
                                    <IconBoundary>
                                        <Icon
                                            filePath={icons.expand}
                                            heightAndWidth="16px"
                                            onClick={() =>
                                                this.toggleSidebarWidthLock()
                                            }
                                        />
                                    </IconBoundary>
                                </TooltipBox>
                            ))}
                        <TooltipBox tooltipText="Close (ESC)" placement="left">
                            <IconBoundary>
                                <Icon
                                    filePath={icons.removeX}
                                    heightAndWidth="16px"
                                    onClick={() => this.hideSidebar()}
                                />
                            </IconBoundary>
                        </TooltipBox>
                    </BottomArea>
                </TopBarActionBtns>
                {this.props.sidebarContext !== 'dashboard' && (
                    <FooterArea>
                        <IconBoundary>
                            <Icon
                                heightAndWidth="16px"
                                filePath={
                                    'settings'
                                    // this.props.bookmark.isBookmarked
                                    //     ? icons.heartFull
                                    //     : icons.heartEmpty
                                }
                            />
                        </IconBoundary>
                        <IconBoundary>
                            <Icon
                                heightAndWidth="16px"
                                filePath={
                                    'helpIcon'
                                    // this.props.bookmark.isBookmarked
                                    //     ? icons.heartFull
                                    //     : icons.heartEmpty
                                }
                            />
                        </IconBoundary>
                    </FooterArea>
                )}
            </>
        )
    }

    private renderTopBar() {
        if (this.props.skipTopBarRender) {
            return null
        }

        return (
            <>
                <TopBarActionBtns
                    width={this.state.sidebarWidth}
                    sidebarContext={this.props.sidebarContext}
                >
                    {this.state.isLocked ? (
                        <TooltipBox
                            tooltipText="Unlock sidebar"
                            placement="bottom"
                        >
                            <Icon
                                filePath={icons.arrowRight}
                                heightAndWidth="26px"
                                onClick={this.toggleSidebarLock}
                            />
                        </TooltipBox>
                    ) : (
                        <TooltipBox
                            tooltipText="Lock sidebar open"
                            placement="bottom"
                        >
                            <Icon
                                filePath={icons.arrowLeft}
                                heightAndWidth="26px"
                                onClick={this.toggleSidebarLock}
                            />
                        </TooltipBox>
                    )}
                    {!this.state.isWidthLocked ? (
                        <TooltipBox
                            tooltipText="Adjust Page Width"
                            placement="bottom"
                        >
                            <Icon
                                filePath={icons.compress}
                                heightAndWidth="26px"
                                onClick={() => this.toggleSidebarWidthLock()}
                            />
                        </TooltipBox>
                    ) : (
                        <TooltipBox
                            tooltipText="Full page width"
                            placement="bottom"
                        >
                            <Icon
                                filePath={icons.expand}
                                heightAndWidth="26px"
                                onClick={() => this.toggleSidebarWidthLock()}
                            />
                        </TooltipBox>
                    )}
                    <TooltipBox tooltipText="Close (ESC)" placement="bottom">
                        <Icon
                            filePath={icons.removeX}
                            heightAndWidth="22px"
                            onClick={() => this.hideSidebar()}
                            padding={'5px'}
                        />
                    </TooltipBox>
                </TopBarActionBtns>
            </>
        )
    }

    render() {
        if (this.state.showState === 'hidden') {
            return null
        }

        const style = {
            height: '100%',
            position: 'relative',
            right: '0px',
            left: 'unset',
        } as const

        return (
            <ThemeProvider theme={this.props.theme}>
                <GlobalStyle sidebarWidth={this.state.sidebarWidth} />
                <ContainerStyled
                    className={classNames('ignore-react-onclickoutside')}
                    sidebarContext={this.props.sidebarContext}
                    isShown={this.state.showState}
                >
                    {this.renderTopSideBar()}
                    <Rnd
                        style={style}
                        default={{
                            x: 0,
                            y: 0,
                            width: this.state.sidebarWidth
                                ? this.state.sidebarWidth
                                : SIDEBAR_WIDTH_STORAGE_KEY.replace('px', ''),
                            height: 'auto',
                        }}
                        resizeHandleWrapperClass={'sidebarResizeHandle'}
                        className="sidebar-draggable"
                        resizeGrid={[1, 0]}
                        dragAxis={'none'}
                        minWidth={SIDEBAR_WIDTH_STORAGE_KEY}
                        maxWidth={'1000px'}
                        disableDragging={true}
                        enableResizing={{
                            top: false,
                            right: false,
                            bottom: false,
                            left: true,
                            topRight: false,
                            bottomRight: false,
                            bottomLeft: false,
                            topLeft: false,
                        }}
                        onResizeStop={(e, direction, ref, delta, position) => {
                            // if (this.props.sidebarContext !== 'dashboard') {
                            this.processEvent('adjustSidebarWidth', {
                                newWidth: ref.style.width,
                                isWidthLocked: this.state.isWidthLocked,
                            })
                            // }

                            if (this.props.sidebarContext === 'dashboard') {
                                this.props.setSidebarWidthforDashboard(
                                    ref.style.width,
                                )
                            }
                        }}
                    >
                        <AnnotationsSidebar
                            {...this.state}
                            // sidebarActions={null}
                            getListDetailsById={this.getListDetailsById}
                            sidebarContext={this.props.sidebarContext}
                            ref={this.sidebarRef as any}
                            openCollectionPage={(remoteListId) =>
                                window.open(
                                    getListShareUrl({ remoteListId }),
                                    '_blank',
                                )
                            }
                            onMenuItemClick={({ sortingFn }) =>
                                this.processEvent('sortAnnotations', {
                                    sortingFn,
                                })
                            }
                            annotationUrls={() =>
                                this.state.annotations.map((a) => a.url)
                            }
                            normalizedPageUrls={[
                                normalizeUrl(this.state.pageUrl),
                            ]}
                            normalizedPageUrl={normalizeUrl(this.state.pageUrl)}
                            onClickOutsideCopyPaster={() =>
                                this.processEvent(
                                    'resetCopyPasterAnnotationId',
                                    null,
                                )
                            }
                            copyPaster={this.props.copyPaster}
                            contentSharing={this.props.contentSharing}
                            annotationsShareAll={this.props.annotations}
                            copyPageLink={(link) => {
                                this.processEvent('copyNoteLink', { link })
                            }}
                            postBulkShareHook={(shareInfo) =>
                                this.processEvent(
                                    'updateAllAnnotationsShareInfo',
                                    shareInfo,
                                )
                            }
                            onCopyBtnClick={() => this.handleCopyAllNotesClick}
                            onShareAllNotesClick={() =>
                                this.handleCopyAllNotesClick
                            }
                            sharingAccess={this.state.annotationSharingAccess}
                            needsWaypoint={!this.state.noResults}
                            appendLoader={
                                this.state.secondarySearchState === 'running'
                            }
                            annotationModes={
                                this.state.annotationModes.pageAnnotations
                            }
                            setActiveAnnotationUrl={(annotationUrl) => () =>
                                this.processEvent('setActiveAnnotationUrl', {
                                    annotationUrl,
                                })}
                            isAnnotationCreateShown={this.state.showCommentBox}
                            setPopoutsActive={(isActive) => {
                                this.processEvent('setPopoutsActive', isActive)
                            }}
                            annotationCreateProps={this.getCreateProps()}
                            bindAnnotationFooterEventProps={(
                                annotation,
                                followedListId,
                            ) =>
                                this.bindAnnotationFooterEventProps(
                                    annotation,
                                    followedListId,
                                )
                            }
                            bindAnnotationEditProps={
                                this.bindAnnotationEditProps
                            }
                            handleScrollPagination={() =>
                                this.processEvent('paginateSearch', null)
                            }
                            isSearchLoading={
                                this.state.annotationsLoadState === 'running' ||
                                this.state.loadState === 'running'
                            }
                            onClickOutside={this.handleClickOutside}
                            theme={this.props.theme}
                            renderCopyPasterForAnnotation={
                                this.renderCopyPasterManagerForAnnotation
                            }
                            renderShareMenuForAnnotation={
                                this.renderShareMenuForAnnotation
                            }
                            activeShareMenuNoteId={
                                this.state.activeShareMenuNoteId
                            }
                            shareButtonRef={this.shareButtonRef}
                            renderTagsPickerForAnnotation={undefined}
                            spacePickerButtonRef={this.spacePickerButtonRef}
                            renderListsPickerForAnnotation={
                                this.renderListPickerForAnnotation
                            }
                            expandMyNotes={() =>
                                this.processEvent('expandMyNotes', null)
                            }
                            expandFeed={() =>
                                this.processEvent('expandFeed', null)
                            }
                            expandSharedSpaces={(listIds) =>
                                this.processEvent('expandSharedSpaces', {
                                    listIds,
                                })
                            }
                            expandFollowedListNotes={(listId) =>
                                this.processEvent('expandFollowedListNotes', {
                                    listId,
                                })
                            }
                            toggleIsolatedListView={(listId) =>
                                this.processEvent('toggleIsolatedListView', {
                                    listId,
                                })
                            }
                            bindSharedAnnotationEventHandlers={(
                                annotationReference,
                                sharedListReference,
                            ) => ({
                                onReplyBtnClick: () =>
                                    this.processEvent(
                                        'toggleAnnotationReplies',
                                        {
                                            annotationReference,
                                            sharedListReference,
                                        },
                                    ),
                                onNewReplyInitiate: () =>
                                    this.processEvent(
                                        'initiateNewReplyToAnnotation',
                                        {
                                            annotationReference,
                                            sharedListReference,
                                        },
                                    ),
                                onNewReplyCancel: () =>
                                    this.processEvent(
                                        'cancelNewReplyToAnnotation',
                                        {
                                            annotationReference,
                                            sharedListReference,
                                        },
                                    ),
                                onNewReplyConfirm: () =>
                                    this.processEvent(
                                        'confirmNewReplyToAnnotation',
                                        {
                                            annotationReference,
                                            sharedListReference,
                                        },
                                    ),
                                onNewReplyEdit: ({ content }) =>
                                    this.processEvent(
                                        'editNewReplyToAnnotation',
                                        {
                                            annotationReference,
                                            sharedListReference,
                                            content,
                                        },
                                    ),
                            })}
                        />
                    </Rnd>
                </ContainerStyled>
                {this.renderModals()}
            </ThemeProvider>
        )
    }
}

const GlobalStyle = createGlobalStyle<{
    sidebarWidth: string
}>`

    & * {
        font-family: 'Satoshi'
    }

    .sidebar-draggable {
        height: 100% !important;
    }

    .sidebarResizeHandle {
    width: 4px;
    height: 100vh;
    position: absolute;
    top: 0px;

        &:hover {
        background: #5671cf30;
    }

    #outerContainer {
        width: ${(props) => props.sidebarWidth};
    }

    #outerContainer {
        width: ${(props) => props.sidebarWidth};
    }
`

const ShareMenuWrapper = styled.div`
    position: absolute;
    right: 320px;
    z-index: 10000;
`

const PickerWrapper = styled.div`
    position: sticky;
    z-index: 5;
`

const ContainerStyled = styled.div<{ sidebarContext: string; isShown: string }>`
    height: 100%;
    overflow-x: visible;
    position: fixed;
    padding: 0px 0px 10px 0px;

    right: ${({ theme }: Props) => theme?.rightOffsetPx ?? 0}px;
    top: 0px;
    padding-right: ${({ theme }: Props) => theme?.paddingRight ?? 0}px;

    z-index: ${(props) =>
        props.sidebarContext === 'dashboard'
            ? '2147483641'
            : '2147483646'}; /* This is to combat pages setting high values on certain elements under the sidebar */
    background: ${(props) => props.theme.colors.backgroundColor};
    border-left: 1px solid ${(props) => props.theme.colors.lineGrey};
    font-family: 'Satoshi', sans-serif;
    box-sizing: content-box;
    animation: ${(props) =>
        props.sidebarContext === 'in-page' && 'slide-in ease-out'};
    animation-duration: 0.05s;
    /* transition : all 2s ease; */
    // place it initially at -100%

    &:: -webkit-scrollbar {
        display: none;
    }

    scrollbar-width: none;

    ${(props) =>
        props.isShown !== 'visible' &&
        css`
            transition: all 2s ease;
            transform: translateX(-600px);
        `}

    @keyframes slide-in {
        0% {
            right: -450px;
            opacity: 0%;
        }
        100% {
            right: 0px;
            opacity: 100%;
        }
    }

    @keyframes slide-out {
        0% {
            right: 0px;
            opacity: 100%;
        }
        100% {
            right: -450px;
            opacity: 0%;
        }
    }
`

const TopBarActionBtns = styled.div<{ width: string; sidebarContext: string }>`
    display: flex;
    grid-gap: 30px;
    align-items: center;
    flex-direction: column;
    position: absolute;
    top: 12px;
    margin-left: 8px;
    z-index: 2;

    ${(props) =>
        props.sidebarContext === 'dashboard' &&
        css`
            top: 17px;
            margin-left: -12px;
        `};
`

const IconBoundary = styled.div`
    border: 1px solid ${(props) => props.theme.colors.lightHover};
    border-radius: 5px;
    height: fit-content;
    width: fit-content;
    background: ${(props) => props.theme.colors.backgroundColor};
`

const BottomArea = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    grid-gap: 8px;
`

const TopArea = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    grid-gap: 8px;
`

const FooterArea = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    grid-gap: 8px;
    position: absolute;
    bottom: 20px;
    margin-left: 8px;
    z-index: 2;
`
