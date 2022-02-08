import * as React from 'react'
import styled, { ThemeProvider } from 'styled-components'

import { StatefulUIElement } from 'src/util/ui-logic'
import AnnotationsSidebar, {
    AnnotationsSidebarProps,
} from '../components/AnnotationsSidebar'
import {
    SidebarContainerLogic,
    SidebarContainerOptions,
    INIT_FORM_STATE,
} from './logic'
import type {
    SidebarContainerState,
    SidebarContainerEvents,
    AnnotationEventContext,
} from './types'
import { ButtonTooltip } from 'src/common-ui/components'
import { AnnotationFooterEventProps } from 'src/annotations/components/AnnotationFooter'
import { Annotation } from 'src/annotations/types'
import {
    AnnotationEditEventProps,
    AnnotationEditGeneralProps,
} from 'src/annotations/components/AnnotationEdit'
import { HoverBox } from 'src/common-ui/components/design-library/HoverBox'
import * as icons from 'src/common-ui/components/design-library/icons'
import AllNotesShareMenu from 'src/overview/sharing/AllNotesShareMenu'
import SingleNoteShareMenu from 'src/overview/sharing/SingleNoteShareMenu'
import { PageNotesCopyPaster } from 'src/copy-paster'
import { normalizeUrl } from '@worldbrain/memex-url-utils'
import { copyToClipboard } from 'src/annotations/content_script/utils'
import analytics from 'src/analytics'
import { SortingDropdownMenuBtn } from '../components/SortingDropdownMenu'
import TagPicker from 'src/tags/ui/TagPicker'
import { PickerUpdateHandler } from 'src/common-ui/GenericPicker/types'
import { getListShareUrl } from 'src/content-sharing/utils'
import { ClickAway } from 'src/util/click-away-wrapper'
import CollectionPicker from 'src/custom-lists/ui/CollectionPicker'
import { SpacePickerDependencies } from 'src/custom-lists/ui/CollectionPicker/logic'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'

const DEF_CONTEXT: { context: AnnotationEventContext } = {
    context: 'pageAnnotations',
}

export interface Props extends SidebarContainerOptions {
    skipTopBarRender?: boolean
    isLockable?: boolean
    sidebarContext?: string
}

export class AnnotationsSidebarContainer<
    P extends Props = Props
> extends StatefulUIElement<P, SidebarContainerState, SidebarContainerEvents> {
    private sidebarRef

    constructor(props: P) {
        super(
            props,
            new SidebarContainerLogic({
                ...props,
                analytics,
                copyToClipboard,
                focusCreateForm: () =>
                    this.sidebarRef?.getInstance()?.focusCreateForm(),
            }),
        )
    }

    private getListNameById = (listId: number): string =>
        this.state.listData[listId]?.name ?? 'Missing list'

    toggleSidebarShowForPageId(pageId: string) {
        const isAlreadyOpenForOtherPage = pageId !== this.state.pageUrl

        if (this.state.showState === 'hidden' || isAlreadyOpenForOtherPage) {
            this.setPageUrl(pageId)
            this.showSidebar()
        } else if (this.state.showState === 'visible') {
            this.hideSidebar()
        }
    }

    showSidebar() {
        this.processEvent('show', null)
    }

    hideSidebar() {
        this.processEvent('hide', null)
    }

    toggleSidebarLock = () =>
        this.processEvent(this.state.isLocked ? 'unlock' : 'lock', null)

    toggleSidebarWidthLock = () => {
        this.processEvent(
            this.state.isWidthLocked ? 'unlockWidth' : 'lockWidth',
            null,
        )
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

        if (this.state.showState === 'visible') {
            this.hideSidebar()
        }
    }

    protected bindAnnotationFooterEventProps(
        annotation: Annotation,
    ): AnnotationFooterEventProps & {
        onGoToAnnotation?: React.MouseEventHandler
    } {
        return {
            onEditIconClick: () =>
                this.processEvent('setAnnotationEditMode', {
                    annotationUrl: annotation.url,
                    ...DEF_CONTEXT,
                }),
            onDeleteIconClick: () =>
                this.processEvent('switchAnnotationMode', {
                    annotationUrl: annotation.url,
                    mode: 'delete',
                    ...DEF_CONTEXT,
                }),
            onDeleteCancel: () =>
                this.processEvent('switchAnnotationMode', {
                    annotationUrl: annotation.url,
                    mode: 'default',
                    ...DEF_CONTEXT,
                }),
            onDeleteConfirm: () =>
                this.processEvent('deleteAnnotation', {
                    annotationUrl: annotation.url,
                    ...DEF_CONTEXT,
                }),
            onEditCancel: () =>
                this.processEvent('cancelEdit', {
                    annotationUrl: annotation.url,
                }),
            onEditConfirm: (shouldShare, isProtected) =>
                this.processEvent('editAnnotation', {
                    annotationUrl: annotation.url,
                    shouldShare,
                    isProtected,
                    ...DEF_CONTEXT,
                }),
            onShareClick: (mouseEvent) =>
                this.processEvent('shareAnnotation', {
                    annotationUrl: annotation.url,
                    ...DEF_CONTEXT,
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
                }),
            onTagIconClick: () =>
                this.processEvent('setTagPickerAnnotationId', {
                    id: annotation.url,
                }),
            onListIconClick: () =>
                this.processEvent('setListPickerAnnotationId', {
                    id: annotation.url,
                }),
        }
    }

    protected bindAnnotationEditProps(
        annotation: Annotation,
    ): AnnotationEditEventProps & AnnotationEditGeneralProps {
        const { editForms } = this.state
        // Should only ever be undefined for a moment, between creating a new annot state and
        //  the time it takes for the BG method to return the generated PK
        const form = editForms[annotation.url] ?? { ...INIT_FORM_STATE }

        return {
            comment: form.commentText,
            onCommentChange: (comment) =>
                this.processEvent('changeEditCommentText', {
                    annotationUrl: annotation.url,
                    comment,
                }),
            onEditConfirm: (shouldShare: boolean, isProtected?: boolean) =>
                this.processEvent('editAnnotation', {
                    annotationUrl: annotation.url,
                    isProtected: isProtected ?? annotation.isBulkShareProtected,
                    shouldShare,
                    ...DEF_CONTEXT,
                }),
            onEditCancel: () =>
                this.processEvent('cancelEdit', {
                    annotationUrl: annotation.url,
                }),
        }
    }

    protected getShareCollectionPickerProps(): SpacePickerDependencies {
        return {
            spacesBG: this.props.customLists,
            contentSharingBG: this.props.contentSharing,
            createNewEntry: async (name) =>
                this.props.customLists.createCustomList({ name }),
            selectEntry: async (id) => {
                this.props.customLists.insertPageToList({
                    id,
                    url: this.state.pageUrl,
                })
            },
            unselectEntry: async (id) => {
                this.props.customLists.removePageFromList({
                    id,
                    url: this.state.pageUrl,
                })
            },
        }
    }

    protected getCreateProps(): AnnotationsSidebarProps['annotationCreateProps'] {
        const spacePickerProps = this.getShareCollectionPickerProps()
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
            getListNameById: this.getListNameById,
            tagQueryEntries: (query) =>
                this.props.tags.searchForTagSuggestions({ query }),
            loadDefaultTagSuggestions: this.props.tags
                .fetchInitialTagSuggestions,
            addPageToList: spacePickerProps.selectEntry,
            removePageFromList: spacePickerProps.unselectEntry,
            comment: this.state.commentBox.commentText,
            tags: this.state.commentBox.tags,
            lists: this.state.commentBox.lists,
            contentSharingBG: spacePickerProps.contentSharingBG,
            spacesBG: spacePickerProps.spacesBG,
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

    private renderCopyPasterManagerForAnnotation = (
        currentAnnotationId: string,
    ) => {
        if (this.state.activeCopyPasterAnnotationId !== currentAnnotationId) {
            return null
        }

        return (
            <CopyPasterWrapper>
                {this.renderCopyPasterManager([currentAnnotationId])}
            </CopyPasterWrapper>
        )
    }

    private renderTagsPickerForAnnotation = (currentAnnotationId: string) => {
        if (this.state.activeTagPickerAnnotationId !== currentAnnotationId) {
            return null
        }

        const annot = this.props.annotationsCache.getAnnotationById(
            currentAnnotationId,
        )

        return (
            <PickerWrapper>
                <HoverBox left="-130px" top="-40px" position="absolute">
                    <ClickAway
                        onClickAway={() =>
                            this.processEvent(
                                'resetTagPickerAnnotationId',
                                null,
                            )
                        }
                    >
                        <TagPicker
                            initialSelectedEntries={() => annot.tags}
                            queryEntries={(query) =>
                                this.props.tags.searchForTagSuggestions({
                                    query,
                                })
                            }
                            loadDefaultSuggestions={
                                this.props.tags.fetchInitialTagSuggestions
                            }
                            onUpdateEntrySelection={this.handleTagsUpdate(
                                currentAnnotationId,
                            )}
                            onEscapeKeyDown={() =>
                                this.processEvent(
                                    'resetTagPickerAnnotationId',
                                    null,
                                )
                            }
                        />
                    </ClickAway>
                </HoverBox>
            </PickerWrapper>
        )
    }

    private renderListPickerContentForAnnotation = (
        currentAnnotationId: string,
    ) => {
        const annot = this.props.annotationsCache.getAnnotationById(
            currentAnnotationId,
        )
        const collectionPickerProps = this.getShareCollectionPickerProps()
        return (
            <CollectionPicker
                initialSelectedEntries={() => annot.lists ?? []}
                onEscapeKeyDown={() =>
                    this.processEvent('resetListPickerAnnotationId', null)
                }
                {...collectionPickerProps}
            />
        )
    }

    private renderListPickerForAnnotation = (currentAnnotationId: string) => {
        // TODO: may be used once tags and lists are unified
        // Not used yet but will be used for the "Add to collection" button
        if (this.state.activeListPickerAnnotationId !== currentAnnotationId) {
            return null
        }
        return (
            <PickerWrapper>
                <HoverBox>
                    <ClickAway
                        onClickAway={() =>
                            this.processEvent(
                                'resetListPickerAnnotationId',
                                null,
                            )
                        }
                    >
                        {this.renderListPickerContentForAnnotation(
                            currentAnnotationId,
                        )}
                    </ClickAway>
                </HoverBox>
            </PickerWrapper>
        )
    }

    private renderShareMenuForAnnotation = (currentAnnotationId: string) => {
        if (this.state.activeShareMenuNoteId !== currentAnnotationId) {
            return null
        }

        const currentAnnotation = this.state.annotations.find(
            (annot) => annot.url === currentAnnotationId,
        )

        return (
            <ShareMenuWrapper>
                <HoverBox width="320px">
                    <ClickAway
                        onClickAway={() =>
                            this.processEvent('resetShareMenuNoteId', null)
                        }
                    >
                        <SingleNoteShareMenu
                            isShared={currentAnnotation?.isShared}
                            shareImmediately={this.state.immediatelyShareNotes}
                            contentSharingBG={this.props.contentSharing}
                            annotationsBG={this.props.annotations}
                            copyLink={(link) =>
                                this.processEvent('copyNoteLink', { link })
                            }
                            annotationUrl={currentAnnotationId}
                            postShareHook={(state) =>
                                this.processEvent('updateAnnotationShareInfo', {
                                    annotationUrl: currentAnnotationId,
                                    ...state,
                                })
                            }
                            closeShareMenu={() =>
                                this.processEvent('resetShareMenuNoteId', null)
                            }
                        />
                        <CollectionContainer>
                            {this.renderListPickerContentForAnnotation(
                                currentAnnotationId,
                            )}
                        </CollectionContainer>
                    </ClickAway>
                </HoverBox>
            </ShareMenuWrapper>
        )
    }

    private renderCopyPasterManager(annotationUrls: string[]) {
        return (
            <HoverBox padding={'0px'}>
                <PageNotesCopyPaster
                    copyPaster={this.props.copyPaster}
                    annotationUrls={annotationUrls}
                    normalizedPageUrls={[normalizeUrl(this.state.pageUrl)]}
                    onClickOutside={() =>
                        this.processEvent('resetCopyPasterAnnotationId', null)
                    }
                />
            </HoverBox>
        )
    }

    protected renderModals() {
        return null
    }

    protected renderTopBanner() {
        return null
    }

    private renderTopBar() {
        if (this.props.skipTopBarRender) {
            return null
        }

        return (
            <>
                <TopBarActionBtns sidebarContext={this.props.sidebarContext}>
                    <ButtonTooltip
                        tooltipText="Close (ESC)"
                        position="rightCentered"
                    >
                        <Icon
                            filePath={icons.close}
                            heightAndWidth="16px"
                            onClick={() => this.hideSidebar()}
                        />
                    </ButtonTooltip>
                    {this.state.isLocked ? (
                        <ButtonTooltip
                            tooltipText="Unlock sidebar"
                            position="rightCentered"
                        >
                            <Icon
                                filePath={icons.doubleArrow}
                                heightAndWidth="16px"
                                rotation={'180'}
                                onClick={this.toggleSidebarLock}
                            />
                        </ButtonTooltip>
                    ) : (
                        <ButtonTooltip
                            tooltipText="Lock sidebar open"
                            position="rightCentered"
                        >
                            <Icon
                                filePath={icons.doubleArrow}
                                heightAndWidth="16px"
                                onClick={this.toggleSidebarLock}
                            />
                        </ButtonTooltip>
                    )}
                    {!this.state.isWidthLocked ? (
                        <ButtonTooltip
                            tooltipText="Adjusted Page Width"
                            position="rightCentered"
                        >
                            <Icon
                                filePath={icons.compress}
                                heightAndWidth="16px"
                                onClick={() => this.toggleSidebarWidthLock()}
                            />
                        </ButtonTooltip>
                    ) : (
                        <ButtonTooltip
                            tooltipText="Full page width"
                            position="rightCentered"
                        >
                            <Icon
                                filePath={icons.expand}
                                heightAndWidth="16px"
                                onClick={() => this.toggleSidebarWidthLock()}
                            />
                        </ButtonTooltip>
                    )}
                </TopBarActionBtns>
            </>
        )
    }

    render() {
        if (this.state.showState === 'hidden') {
            return null
        }

        return (
            <ThemeProvider theme={this.props.theme}>
                <ContainerStyled className="ignore-react-onclickoutside">
                    {this.renderTopBanner()}
                    {this.renderTopBar()}
                    <AnnotationsSidebar
                        {...this.state}
                        getListNameById={this.getListNameById}
                        sidebarContext={this.props.sidebarContext}
                        ref={(ref) => (this.sidebarRef = ref)}
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
                        normalizedPageUrls={[normalizeUrl(this.state.pageUrl)]}
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
                        postBulkShareHook={(shareStates) =>
                            this.processEvent(
                                'updateAllAnnotationsShareInfo',
                                shareStates,
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
                        annotationCreateProps={this.getCreateProps()}
                        bindAnnotationFooterEventProps={(annot) =>
                            this.bindAnnotationFooterEventProps(annot)
                        }
                        bindAnnotationEditProps={(annot) =>
                            this.bindAnnotationEditProps(annot)
                        }
                        handleScrollPagination={() =>
                            this.processEvent('paginateSearch', null)
                        }
                        isSearchLoading={
                            this.state.primarySearchState === 'running' ||
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
                        renderTagsPickerForAnnotation={
                            this.renderTagsPickerForAnnotation
                        }
                        // Not used yet but will be used for the "Add to collection" button
                        renderListsPickerForAnnotation={
                            this.renderListPickerForAnnotation
                        }
                        expandMyNotes={() =>
                            this.processEvent('expandMyNotes', null)
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
                        ) => ({
                            onReplyBtnClick: () =>
                                this.processEvent('toggleAnnotationReplies', {
                                    annotationReference,
                                }),
                            onNewReplyInitiate: () =>
                                this.processEvent(
                                    'initiateNewReplyToAnnotation',
                                    {
                                        annotationReference,
                                    },
                                ),
                            onNewReplyCancel: () =>
                                this.processEvent(
                                    'cancelNewReplyToAnnotation',
                                    { annotationReference },
                                ),
                            onNewReplyConfirm: () =>
                                this.processEvent(
                                    'confirmNewReplyToAnnotation',
                                    { annotationReference },
                                ),
                            onNewReplyEdit: ({ content }) =>
                                this.processEvent('editNewReplyToAnnotation', {
                                    annotationReference,
                                    content,
                                }),
                        })}
                    />
                </ContainerStyled>
                {this.renderModals()}
            </ThemeProvider>
        )
    }
}

const CollectionContainer = styled.div`
    width: 100%;

    &:first-child {
        padding-top: 15px;
    }
`

const ShareMenuWrapper = styled.div`
    position: relative;
    left: 105px;
    z-index: 10;
`

const ShareMenuWrapperTopBar = styled.div`
    position: fixed;
    right: 345px;
    z-index: 3;
`

const CopyPasterWrapperTopBar = styled.div`
    position: fixed;
    right: 375px;
    z-index: 3;
`

const CopyPasterWrapper = styled.div`
    position: sticky;
    left: 75px;
    z-index: 5;
`

const PickerWrapper = styled.div`
    position: sticky;
    z-index: 5;
`

const ContainerStyled = styled.div`
    height: 100%;
    overflow-x: visible;
    width: 450px;
    position: fixed;
    padding: 0px 0px 10px 0px;

    right: ${({ theme }: Props) => theme?.rightOffsetPx ?? 0}px;
    top: ${({ theme }: Props) => theme?.topOffsetPx ?? 0}px;
    padding-right: ${({ theme }: Props) => theme?.paddingRight ?? 0}px;

    z-index: 999999899; /* This is to combat pages setting high values on certain elements under the sidebar */
    background: ${(props) => props.theme.colors.backgroundColor};
    transition: all 0.1s cubic-bezier(0.65, 0.05, 0.36, 1) 0s;
    border-left: 1px solid ${(props) => props.theme.colors.lineGrey};
    font-family: 'Inter', sans-serif;

    &::-webkit-scrollbar {
        display: none;
    }

    scrollbar-width: none;
`

const TopBarContainerStyled = styled.div`
    position: sticky;
    top: 0;
    z-index: 1000;
    background: #f6f8fb;
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 34px;
    box-sizing: border-box;
    padding: 5px 15px 5px 5px;
    width: 100%;
    margin-bottom: 2px;
    box-shadow: 0px 3px 5px -3px #c9c9c9;
`

const TopBarActionBtns = styled.div<{ width: string; sidebarContext: string }>`
    display: grid;
    justify-content: flex-start;
    position: absolute;
    align-items: center;
    gap: 8px;
    background-color: ${(props) => props.theme.colors.backgroundColor};
    border-radius: 0 0 0 5px;
    padding: 5px 1px 5px 3px;
    z-index: 10000;
    right: 4px;
    position: relative;
    border-left: 1px solid ${(props) => props.theme.colors.lineGrey};
    border-bottom: 1px solid ${(props) => props.theme.colors.lineGrey};
`

const CloseBtn = styled.button`
    cursor: pointer;
    z-index: 2147483647;
    line-height: normal;
    background: transparent;
    border: none;
    outline: none;
    width: 24px;
    height: 24px;
    padding: 4px;
    display: flex;
    justify-content: center;
    border-radius: 3px;
    align-items: center;
`

const ActionIcon = styled.img`
    height: 90%;
    width: auto;
`

const SidebarLockIcon = styled.img`
    height: 100%;
    width: auto;
`

const SidebarLockIconReverse = styled.img`
    width: auto;
    height: 100%;
    transform: rotate(180deg);
    animation: 0.2s cubic-bezier(0.65, 0.05, 0.36, 1);
`

// TODO: inheirits from .nakedSquareButton
const ActionBtn = styled.button`
    border-radius: 3px;
    padding: 2px;
    width: 24px;
    height: 24px;
    padding: 3px;
    border-radius: 3px;
    background-repeat: no-repeat;
    background-position: center;
    border: none;
    background-color: transparent;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
        background-color: #e0e0e0;
    }

    &:active {
    }

    &:focus {
        outline: none;
    }

    &:disabled {
        opacity: 0.4;
        background-color: transparent;
    }
`
