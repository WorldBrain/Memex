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
import classNames from 'classnames'
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
import type { AnnotationMode } from 'src/sidebar/annotations-sidebar/types'
import { Rnd } from 'react-rnd'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import { SpacePickerDependencies } from 'src/custom-lists/ui/CollectionPicker/logic'
import CollectionPicker from 'src/custom-lists/ui/CollectionPicker'

import { createGlobalStyle } from 'styled-components'
import { SIDEBAR_WIDTH_STORAGE_KEY } from '../constants'
import { getLocalStorage, setLocalStorage } from 'src/util/storage'
import { Browser, browser } from 'webextension-polyfill-ts'

const DEF_CONTEXT: { context: AnnotationEventContext } = {
    context: 'pageAnnotations',
}

export interface Props extends SidebarContainerOptions {
    skipTopBarRender?: boolean
    isLockable?: boolean
}

export class AnnotationsSidebarContainer<
    P extends Props = Props
> extends StatefulUIElement<P, SidebarContainerState, SidebarContainerEvents> {
    private sidebarRef

    private DraggableContainer

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
        setLocalStorage(SIDEBAR_WIDTH_STORAGE_KEY, '450px')
        this.processEvent('show', null)
    }

    hideSidebar() {
        if (this.state.isWidthLocked) {
            setLocalStorage(SIDEBAR_WIDTH_STORAGE_KEY, '-40px') // the -40px is because in logic.ts in AdjustSidebarWidth I add a margin of 40px
        }
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
            createNewList: async (name) => {
                const listId = await customLists.createCustomList({
                    name,
                })
                this.processMutation({
                    listData: { [listId]: { $set: { name } } },
                })
                return listId
            },
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
            getListNameById: this.getListNameById,
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
    ): SpacePickerDependencies => ({
        spacesBG: this.props.customLists,
        contentSharingBG: this.props.contentSharing,
        initialSelectedEntries: () => annotation.lists ?? [],
        onEscapeKeyDown: () =>
            this.processEvent('resetListPickerAnnotationId', null),
        createNewEntry: async (name) => {
            const listId = await this.props.customLists.createCustomList({
                name,
            })
            this.processMutation({
                listData: {
                    [listId]: { $set: { name } },
                },
            })
            return listId
        },
        selectEntry: async (listId) =>
            this.processEvent('updateListsForAnnotation', {
                added: listId,
                deleted: null,
                annotationId: annotation.url,
                // options,
            }),
        unselectEntry: async (listId) =>
            this.processEvent('updateListsForAnnotation', {
                added: null,
                deleted: listId,
                annotationId: annotation.url,
            }),
    })

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
                <HoverBox left="0px" top="-40px" position="absolute">
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

    private renderListPickerForAnnotation = (currentAnnotationId: string) => {
        const currentAnnotation = this.props.annotationsCache.getAnnotationById(
            currentAnnotationId,
        )

        if (
            this.state.activeListPickerAnnotationId !== currentAnnotationId ||
            currentAnnotation == null
        ) {
            return null
        }

        return (
            <PickerWrapper>
                <HoverBox top="7px" padding={'0px'}>
                    <ClickAway
                        onClickAway={() =>
                            this.processEvent(
                                'resetListPickerAnnotationId',
                                null,
                            )
                        }
                    >
                        <CollectionPicker
                            {...this.getSpacePickerProps(currentAnnotation)}
                        />
                    </ClickAway>
                </HoverBox>
            </PickerWrapper>
        )
    }

    private renderShareMenuForAnnotation = (currentAnnotationId: string) => {
        const currentAnnotation = this.props.annotationsCache.getAnnotationById(
            currentAnnotationId,
        )

        if (
            this.state.activeShareMenuNoteId !== currentAnnotationId ||
            currentAnnotation == null
        ) {
            return null
        }

        return (
            <ShareMenuWrapper>
                <HoverBox left="-40px" padding={'0px'} width="360px">
                    <ClickAway
                        onClickAway={() =>
                            this.processEvent('resetShareMenuNoteId', null)
                        }
                    >
                        <SingleNoteShareMenu
                            isShared={currentAnnotation.isShared}
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
                            spacePickerProps={this.getSpacePickerProps(
                                currentAnnotation,
                            )}
                        />
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
                <TopBarActionBtns
                    width={this.state.sidebarWidth}
                    sidebarContext={this.props.sidebarContext}
                >
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
                                rotation={180}
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

        const style = {
            height: '100%',
            position: 'relative',
        } as const

        return (
            <ThemeProvider theme={this.props.theme}>
                <GlobalStyle sidebarWidth={this.state.sidebarWidth} />
                <ContainerStyled
                    className={classNames('ignore-react-onclickoutside')}
                >
                    <Rnd
                        ref={this.DraggableContainer}
                        style={style}
                        default={{
                            x: 0,
                            y: 0,
                            width: 450,
                            height: 'auto',
                        }}
                        resizeHandleWrapperClass={'sidebarResizeHandle'}
                        className="sidebar-draggable"
                        resizeGrid={[1, 0]}
                        dragAxis={'none'}
                        minWidth={'340px'}
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
                        onResize={(e, direction, ref, delta, position) => {
                            this.setState({ sidebarWidth: ref.style.width })
                            setLocalStorage(
                                SIDEBAR_WIDTH_STORAGE_KEY,
                                ref.style.width,
                            )
                        }}
                    >
                        <SidebarContainerWithTopBar>
                            {this.renderTopBar()}
                            <AnnotationsSidebar
                                {...this.state}
                                getListNameById={(id) =>
                                    this.state.listData[id]?.name ??
                                    'Missing list'
                                }
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
                                normalizedPageUrls={[
                                    normalizeUrl(this.state.pageUrl),
                                ]}
                                normalizedPageUrl={normalizeUrl(
                                    this.state.pageUrl,
                                )}
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
                                onCopyBtnClick={() =>
                                    this.handleCopyAllNotesClick
                                }
                                onShareAllNotesClick={() =>
                                    this.handleCopyAllNotesClick
                                }
                                sharingAccess={
                                    this.state.annotationSharingAccess
                                }
                                needsWaypoint={!this.state.noResults}
                                appendLoader={
                                    this.state.secondarySearchState ===
                                    'running'
                                }
                                annotationModes={
                                    this.state.annotationModes.pageAnnotations
                                }
                                setActiveAnnotationUrl={(annotationUrl) => () =>
                                    this.processEvent(
                                        'setActiveAnnotationUrl',
                                        {
                                            annotationUrl,
                                        },
                                    )}
                                isAnnotationCreateShown={
                                    this.state.showCommentBox
                                }
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
                                    this.state.primarySearchState ===
                                        'running' ||
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
                                    this.processEvent(
                                        'expandFollowedListNotes',
                                        {
                                            listId,
                                        },
                                    )
                                }
                                toggleIsolatedListView={(listId) =>
                                    this.processEvent(
                                        'toggleIsolatedListView',
                                        {
                                            listId,
                                        },
                                    )
                                }
                                bindSharedAnnotationEventHandlers={(
                                    annotationReference,
                                ) => ({
                                    onReplyBtnClick: () =>
                                        this.processEvent(
                                            'toggleAnnotationReplies',
                                            {
                                                annotationReference,
                                            },
                                        ),
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
                                        this.processEvent(
                                            'editNewReplyToAnnotation',
                                            {
                                                annotationReference,
                                                content,
                                            },
                                        ),
                                })}
                            />
                        </SidebarContainerWithTopBar>
                    </Rnd>
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

const SidebarContainerWithTopBar = styled.div`
    display: flex;
    align-items: flex-start;
    height: 100%;
`

const GlobalStyle = createGlobalStyle<{
    sidebarWidth: string
}>`
    .sidebar-draggable {
        height: 100% !important;
    }

    .sidebarResizeHandle {
    width: 4px;
    height: 100vh;
    position: absolute;
    top: 66px;

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

const NoteTypesWrapper = styled.div`
    display: flex;
    align-items: center;
    font-weight: bold;
`

const ShareMenuWrapper = styled.div`
    position: absolute;
    right: 320px;
    z-index: 10000;
`

const ShareMenuWrapperTopBar = styled.div`
    position: fixed;
    right: 300px;
    z-index: 3;
`

const CopyPasterWrapperTopBar = styled.div`
    position: fixed;
    right: 300px;
    z-index: 3;
`

const CopyPasterWrapper = styled.div`
    position: absolute;
    right: 370px;
    z-index: 10000;
`

const TagPickerWrapper = styled.div`
    position: absolute;
    right: 300px;
    z-index: 10000;
`

const PickerWrapper = styled.div`
    position: sticky;
    z-index: 5;
`

const ContainerStyled = styled.div`
    height: 100%;
    overflow-x: visible;
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

    &:: -webkit-scrollbar {
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
    box-shadow: 0px 3px 5px-3px #c9c9c9;
`

const TopBarActionBtns = styled.div<{ width: string; sidebarContext: string }>`
    display: grid;
    justify-content: flex-start;
    margin-left: -25px;
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
    height: 90 %;
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
