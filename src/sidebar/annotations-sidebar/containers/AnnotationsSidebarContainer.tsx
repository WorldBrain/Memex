import * as React from 'react'
import styled, { ThemeProvider } from 'styled-components'

import { StatefulUIElement } from 'src/util/ui-logic'
import AnnotationsSidebar, {
    AnnotationsSidebarProps,
} from '../components/AnnotationsSidebar'
import {
    SidebarContainerLogic,
    SidebarContainerState,
    SidebarContainerEvents,
    SidebarContainerOptions,
    AnnotationEventContext,
    INIT_FORM_STATE,
} from './logic'
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
    ): AnnotationFooterEventProps {
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
            onEditConfirm: () =>
                this.processEvent('editAnnotation', {
                    annotationUrl: annotation.url,
                    ...DEF_CONTEXT,
                }),
            onShareClick: (e) =>
                this.processEvent('shareAnnotation', {
                    annotationUrl: annotation.url,
                    ...DEF_CONTEXT,
                }),
            onUnshareClick: (e) =>
                this.processEvent('unshareAnnotation', {
                    annotationUrl: annotation.url,
                    ...DEF_CONTEXT,
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
            onEditConfirm: () =>
                this.processEvent('editAnnotation', {
                    annotationUrl: annotation.url,
                    ...DEF_CONTEXT,
                }),
            onEditCancel: () =>
                this.processEvent('cancelEdit', {
                    annotationUrl: annotation.url,
                }),
        }
    }

    protected getCreateProps(): AnnotationsSidebarProps['annotationCreateProps'] {
        return {
            onCommentChange: (comment) =>
                this.processEvent('changeNewPageCommentText', { comment }),
            onTagsUpdate: (tags) =>
                this.processEvent('updateNewPageCommentTags', { tags }),
            onCancel: () => this.processEvent('cancelNewPageComment', null),
            onSave: (privacyLevel) =>
                this.processEvent('saveNewPageComment', { privacyLevel }),
            comment: this.state.commentBox.commentText,
            tags: this.state.commentBox.tags,
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

    private handleShareAllNotesClick: React.MouseEventHandler = (e) => {
        e.preventDefault()

        this.processEvent('setAllNotesShareMenuShown', {
            shown: !this.state.showAllNotesShareMenu,
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

    private renderTagPickerForAnnotation = (currentAnnotationId: string) => {
        if (this.state.activeTagPickerAnnotationId !== currentAnnotationId) {
            return null
        }

        const annot = this.props.annotationsCache.getAnnotationById(
            currentAnnotationId,
        )

        return (
            <TagPickerWrapper>
                <HoverBox>
                    <TagPicker
                        initialSelectedEntries={() => annot.tags}
                        onUpdateEntrySelection={this.handleTagsUpdate(
                            currentAnnotationId,
                        )}
                        onClickOutside={() =>
                            this.processEvent(
                                'resetTagPickerAnnotationId',
                                null,
                            )
                        }
                    />
                </HoverBox>
            </TagPickerWrapper>
        )
    }

    private renderShareMenuForAnnotation = (currentAnnotationId: string) => {
        if (this.state.activeShareMenuNoteId !== currentAnnotationId) {
            return null
        }

        return (
            <ShareMenuWrapper>
                <HoverBox>
                    <SingleNoteShareMenu
                        contentSharingBG={this.props.contentSharing}
                        annotationsBG={this.props.annotations}
                        copyLink={(link) =>
                            this.processEvent('copyNoteLink', { link })
                        }
                        annotationUrl={currentAnnotationId}
                        postShareHook={() =>
                            this.processEvent('updateAnnotationShareInfo', {
                                annotationUrl: currentAnnotationId,
                                info: {
                                    status: 'shared',
                                    taskState: 'success',
                                },
                            })
                        }
                        postUnshareHook={() =>
                            this.processEvent('updateAnnotationShareInfo', {
                                annotationUrl: currentAnnotationId,
                                info: {
                                    status: 'unshared',
                                    taskState: 'success',
                                },
                            })
                        }
                        closeShareMenu={() =>
                            this.processEvent('resetShareMenuNoteId', null)
                        }
                    />
                </HoverBox>
            </ShareMenuWrapper>
        )
    }

    private renderAllNotesShareMenu() {
        if (!this.state.showAllNotesShareMenu) {
            return null
        }

        return (
            <ShareMenuWrapperTopBar>
                <HoverBox>
                    <AllNotesShareMenu
                        contentSharingBG={this.props.contentSharing}
                        annotationsBG={this.props.annotations}
                        copyLink={(link) =>
                            this.processEvent('copyPageLink', { link })
                        }
                        normalizedPageUrl={normalizeUrl(this.state.pageUrl)}
                        postShareAllHook={() =>
                            this.processEvent('updateAllAnnotationsShareInfo', {
                                info: {
                                    status: 'shared',
                                    taskState: 'success',
                                },
                            })
                        }
                        postUnshareAllHook={() =>
                            this.processEvent('updateAllAnnotationsShareInfo', {
                                info: {
                                    status: 'unshared',
                                    taskState: 'success',
                                },
                            })
                        }
                        closeShareMenu={() =>
                            this.processEvent('setAllNotesShareMenuShown', {
                                shown: false,
                            })
                        }
                    />
                </HoverBox>
            </ShareMenuWrapperTopBar>
        )
    }

    private renderCopyPasterManager(annotationUrls: string[]) {
        return (
            <HoverBox>
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

    private renderAllNotesCopyPaster() {
        if (!this.state.showAllNotesCopyPaster) {
            return null
        }

        const annotUrls = this.state.annotations.map((a) => a.url)
        return (
            <CopyPasterWrapperTopBar>
                {this.renderCopyPasterManager(annotUrls)}
            </CopyPasterWrapperTopBar>
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
                <TopBarContainerStyled>
                    <TopBarActionBtns>
                        <ButtonTooltip
                            tooltipText="Close (ESC)"
                            position="rightCentered"
                        >
                            <CloseBtn onClick={() => this.hideSidebar()}>
                                <ActionIcon src={icons.close} />
                            </CloseBtn>
                        </ButtonTooltip>
                        {this.props.isLockable &&
                            (this.state.isLocked ? (
                                <ButtonTooltip
                                    tooltipText="Unlock sidebar"
                                    position="rightCentered"
                                >
                                    <CloseBtn onClick={this.toggleSidebarLock}>
                                        <SidebarLockIconReverse
                                            src={icons.doubleArrow}
                                        />
                                    </CloseBtn>
                                </ButtonTooltip>
                            ) : (
                                <ButtonTooltip
                                    tooltipText="Lock sidebar open"
                                    position="rightCentered"
                                >
                                    <CloseBtn onClick={this.toggleSidebarLock}>
                                        <SidebarLockIcon
                                            src={icons.doubleArrow}
                                        />
                                    </CloseBtn>
                                </ButtonTooltip>
                            ))}
                    </TopBarActionBtns>
                    <TopBarActionBtns>
                        <SortingDropdownMenuBtn
                            onMenuItemClick={({ sortingFn }) =>
                                this.processEvent('sortAnnotations', {
                                    sortingFn,
                                })
                            }
                        />
                        <ButtonTooltip
                            tooltipText="Copy All Notes"
                            position="bottomSidebar"
                        >
                            <ActionBtn onClick={this.handleCopyAllNotesClick}>
                                <ActionIcon src={icons.copy} />
                            </ActionBtn>
                        </ButtonTooltip>
                        <ButtonTooltip
                            tooltipText="Share All Notes"
                            position="bottomRightEdge"
                        >
                            <ActionBtn onClick={this.handleShareAllNotesClick}>
                                <ActionIcon src={icons.shareEmpty} />
                            </ActionBtn>
                        </ButtonTooltip>
                    </TopBarActionBtns>
                </TopBarContainerStyled>
                {this.renderAllNotesCopyPaster()}
                {this.renderAllNotesShareMenu()}
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
                        ref={(ref) => (this.sidebarRef = ref)}
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
                        bindAnnotationFooterEventProps={(url) =>
                            this.bindAnnotationFooterEventProps(url)
                        }
                        bindAnnotationEditProps={(url) =>
                            this.bindAnnotationEditProps(url)
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
                            this.renderTagPickerForAnnotation
                        }
                    />
                </ContainerStyled>
                {this.renderModals()}
            </ThemeProvider>
        )
    }
}

const ShareMenuWrapper = styled.div`
    position: relative;
    left: 105px;
    z-index: 1;
`

const ShareMenuWrapperTopBar = styled.div`
    position: fixed;
    right: 345px;
    z-index: 1;
`

const CopyPasterWrapperTopBar = styled.div`
    position: fixed;
    right: 375px;
    z-index: 1;
`

const CopyPasterWrapper = styled.div`
    position: sticky;
    left: 75px;
    z-index: 5;
`

const TagPickerWrapper = styled.div`
    position: sticky;
    left: 75px;
    z-index: 5;
`

const ContainerStyled = styled.div`
    height: 100%;
    overflow: hidden scroll;
    width: 450px;
    position: fixed;
    padding: 0px 0px 10px 0px;

    right: ${({ theme }: Props) => theme?.rightOffsetPx ?? 0}px;
    top: ${({ theme }: Props) => theme?.topOffsetPx ?? 0}px;
    padding-right: ${({ theme }: Props) => theme?.paddingRight ?? 0}px;

    z-index: 999999899; /* This is to combat pages setting high values on certain elements under the sidebar */
    background: #f6f8fb;
    transition: all 0.1s cubic-bezier(0.65, 0.05, 0.36, 1) 0s;
    box-shadow: rgba(15, 15, 15, 0.05) 0px 0px 0px 1px,
        rgba(15, 15, 15, 0.1) 0px 3px 6px, rgba(15, 15, 15, 0.2) 0px 9px 24px;
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

const TopBarActionBtns = styled.div`
    display: grid;
    justify-content: space-between;
    align-items: center;
    display: grid;
    grid-auto-flow: column;
    grid-gap: 8px;
    height: 24px;

    & * {
        align-items: center;
        display: flex;
        justify-content: center;
    }
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

    &:hover {
        background-color: #e0e0e0;
    }
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
