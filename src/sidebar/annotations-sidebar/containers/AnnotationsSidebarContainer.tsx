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

const DEF_CONTEXT: { context: AnnotationEventContext } = {
    context: 'pageAnnotations',
}

export interface Props extends SidebarContainerOptions {
    skipTopBarRender?: boolean
}

export class AnnotationsSidebarContainer<
    P extends Props = Props
> extends StatefulUIElement<P, SidebarContainerState, SidebarContainerEvents> {
    constructor(props: P) {
        super(props, new SidebarContainerLogic(props))
    }

    showSidebar() {
        this.processEvent('show', null)
    }

    hideSidebar() {
        this.processEvent('hide', null)
    }

    setPageUrl = (pageUrl: string) => {
        this.processEvent('setPageUrl', { pageUrl })
    }

    private handleClickOutside = (e) => {
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
            toggleBookmark: () =>
                this.processEvent('toggleAnnotationBookmark', {
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
                this.processEvent('switchAnnotationMode', {
                    annotationUrl: annotation.url,
                    mode: 'default',
                    ...DEF_CONTEXT,
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
        }
    }

    protected bindAnnotationEditProps(
        annotation: Annotation,
    ): AnnotationEditEventProps & AnnotationEditGeneralProps {
        const { editForms } = this.state
        // Should only ever be undefined for a moment, between creating a new annot state and
        //  the time it takes for the BG method to return the generated PK
        const form = editForms[annotation.url] ?? { ...INIT_FORM_STATE.form }

        return {
            isTagInputActive: form.isTagInputActive,
            comment: form.commentText,
            tags: form.tags,
            updateTags: (args) =>
                this.processEvent('updateTagsForEdit', {
                    annotationUrl: annotation.url,
                    ...args,
                }),
            deleteSingleTag: (tag) =>
                this.processEvent('deleteEditCommentTag', {
                    annotationUrl: annotation.url,
                    tag,
                }),
            setTagInputActive: (active) =>
                this.processEvent('setEditCommentTagPicker', {
                    annotationUrl: annotation.url,
                    active,
                }),
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
                this.processEvent('switchAnnotationMode', {
                    annotationUrl: annotation.url,
                    mode: 'default',
                    ...DEF_CONTEXT,
                }),
        }
    }

    protected getEditableProps(): AnnotationsSidebarProps['annotationEditableProps'] {
        return {
            onMouseEnter: (url) =>
                this.processEvent('annotationMouseEnter', {
                    annotationUrl: url,
                }),
            onMouseLeave: (url) =>
                this.processEvent('annotationMouseLeave', {
                    annotationUrl: url,
                }),
            onGoToAnnotation: (url) =>
                this.processEvent('goToAnnotation', {
                    annotationUrl: url,
                    ...DEF_CONTEXT,
                }),
        }
    }

    protected getCreateProps(): AnnotationsSidebarProps['annotationCreateProps'] {
        return {
            anchor: this.state.commentBox.anchor,
            onCancel: () => this.processEvent('cancelNewPageComment', null),
            onSave: ({ text, isBookmarked, ...args }) =>
                this.processEvent('saveNewPageComment', {
                    commentText: text,
                    isBookmarked,
                    ...args,
                }),
        }
    }

    protected getTagProps(): AnnotationsSidebarProps['annotationTagProps'] {
        return {
            loadDefaultSuggestions: () =>
                this.props.tags.fetchInitialTagSuggestions(),
            queryEntries: (query) =>
                this.props.tags.searchForTagSuggestions({ query }),
        }
    }

    private handleAddCommentBtnClick: React.MouseEventHandler = (e) => {
        e.preventDefault()

        if (this.state.showCommentBox) {
            this.processEvent('cancelNewPageComment', null)
        } else {
            this.processEvent('addNewPageComment', null)
        }
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

    private renderShareMenuForAnnotation = (currentAnnotationId: string) => {
        if (this.state.activeShareMenuNoteId !== currentAnnotationId) {
            return null
        }

        return (
            <ShareMenuWrapper>
                <HoverBox>
                    <SingleNoteShareMenu
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

    private renderTopBar() {
        if (this.props.skipTopBarRender) {
            return null
        }

        return (
            <>
                <TopBarContainerStyled>
                    <ButtonTooltip
                        tooltipText="Close (ESC)"
                        position="rightCentered"
                    >
                        <CloseBtn onClick={() => this.hideSidebar()}>
                            <ActionIcon src={icons.close} />
                        </CloseBtn>
                    </ButtonTooltip>
                    <TopBarActionBtns>
                        <ButtonTooltip
                            tooltipText="Copy All Notes"
                            position="bottom"
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
                    {this.renderTopBar()}
                    <AnnotationsSidebar
                        {...this.state}
                        sharingAccess={this.state.annotationSharingAccess}
                        needsWaypoint={!this.state.noResults}
                        appendLoader={
                            this.state.secondarySearchState === 'running'
                        }
                        annotationModes={
                            this.state.annotationModes.pageAnnotations
                        }
                        isAnnotationCreateShown={this.state.showCommentBox}
                        hoverAnnotationUrl={this.state.hoverAnnotationUrl}
                        annotationTagProps={this.getTagProps()}
                        annotationCreateProps={this.getCreateProps()}
                        annotationEditableProps={this.getEditableProps()}
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
                            this.state.primarySearchState === 'running'
                        }
                        onClickOutside={this.handleClickOutside}
                        theme={this.props.theme}
                        renderCopyPasterForAnnotation={
                            this.renderCopyPasterManagerForAnnotation
                        }
                        renderShareMenuForAnnotation={
                            this.renderShareMenuForAnnotation
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
    background: #fff;
    transition: all 0.1s cubic-bezier(0.65, 0.05, 0.36, 1) 0s;
    box-shadow: rgba(15, 15, 15, 0.05) 0px 0px 0px 1px,
        rgba(15, 15, 15, 0.1) 0px 3px 6px, rgba(15, 15, 15, 0.2) 0px 9px 24px;
`

const TopBarContainerStyled = styled.div`
    position: sticky;
    top: 0;
    z-index: 1000;
    background: #fff;
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 34px;
    box-sizing: border-box;
    padding: 5px 15px 5px 5px;
    width: 100%;
    margin-bottom: 2px;
    box-shadow: 0px 3px 5px -3px #e0e0e0;
`

const TopBarActionBtns = styled.div`
    display: grid;
    justify-content: space-between;
    align-items: center;
    display: grid;
    grid-auto-flow: column;
    grid-gap: 8px;
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

// TODO: inheirits from .nakedSquareButton
const ActionBtn = styled.button`
    border-radius: 3px;
    padding: 2px;
    width: 24px;
    height: 24px;
    padding: 3px;
    border-radius: 3px;
    opacity: 0.8;
    background-repeat: no-repeat;
    background-position: center;
    border: none;
    background-color: transparent;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
        opacity: 1;
        background-color: #e0e0e0;
    }

    &:active {
        opacity: 1;
    }

    &:focus {
        outline: none;
    }

    &:disabled {
        opacity: 0.4;
        background-color: transparent;
    }
`
