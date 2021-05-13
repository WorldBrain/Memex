import * as React from 'react'
import Waypoint from 'react-waypoint'
import styled, { css } from 'styled-components'
import onClickOutside from 'react-onclickoutside'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'

import LoadingIndicator from 'src/common-ui/components/LoadingIndicator'
import AnnotationCreate, {
    AnnotationCreateGeneralProps,
    AnnotationCreateEventProps,
} from 'src/annotations/components/AnnotationCreate'
import AnnotationEditable from 'src/annotations/components/HoverControlledAnnotationEditable'
import TextInputControlled from 'src/common-ui/components/TextInputControlled'
import { Flex } from 'src/common-ui/components/design-library/Flex'
import { Annotation } from 'src/annotations/types'
import CongratsMessage from 'src/annotations/components/parts/CongratsMessage'
import { AnnotationMode, SidebarTheme } from '../types'
import { AnnotationFooterEventProps } from 'src/annotations/components/AnnotationFooter'
import {
    AnnotationEditGeneralProps,
    AnnotationEditEventProps,
} from 'src/annotations/components/AnnotationEdit'
import {
    AnnotationSharingInfo,
    AnnotationSharingAccess,
} from 'src/content-sharing/ui/types'
import { SidebarContainerState } from '../containers/types'

export interface AnnotationsSidebarProps
    extends Omit<SidebarContainerState, 'annotationModes'> {
    annotationModes: { [url: string]: AnnotationMode }
    annotationSharingInfo: { [annotationUrl: string]: AnnotationSharingInfo }

    setActiveAnnotationUrl?: (url: string) => React.MouseEventHandler
    needsWaypoint?: boolean
    appendLoader?: boolean
    handleScrollPagination: () => void

    renderCopyPasterForAnnotation: (id: string) => JSX.Element
    renderTagsPickerForAnnotation: (id: string) => JSX.Element
    renderShareMenuForAnnotation: (id: string) => JSX.Element

    expandFollowedListNotes: (listId: string) => void

    onClickOutside: React.MouseEventHandler
    bindAnnotationFooterEventProps: (
        annotation: Annotation,
    ) => AnnotationFooterEventProps
    bindAnnotationEditProps: (
        annotation: Annotation,
    ) => AnnotationEditGeneralProps & AnnotationEditEventProps
    annotationCreateProps: AnnotationCreateGeneralProps &
        AnnotationCreateEventProps

    sharingAccess: AnnotationSharingAccess
    isSearchLoading: boolean
    isAnnotationCreateShown: boolean
    annotations: Annotation[]
    theme: Partial<SidebarTheme>
}

interface AnnotationsSidebarState {
    searchText?: string
}

class AnnotationsSidebar extends React.Component<
    AnnotationsSidebarProps,
    AnnotationsSidebarState
> {
    private annotationCreateRef // TODO: Figure out how to properly type refs to onClickOutside HOCs

    state = { searchText: '' }

    componentDidMount() {
        document.addEventListener('keydown', this.onKeydown, false)
    }

    componentWillUnmount() {
        document.removeEventListener('keydown', this.onKeydown, false)
    }

    focusCreateForm = () => this.annotationCreateRef?.getInstance()?.focus()

    private onKeydown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            this.props.onClickOutside(e as any)
        }
    }

    private searchEnterHandler = {
        test: (e) => e.key === 'Enter',
        handle: () => undefined,
    }

    private handleSearchChange = (searchText) => {
        this.setState({ searchText })
    }

    private handleSearchClear = () => {
        this.setState({ searchText: '' })
    }

    // NOTE: Currently not used
    private renderSearchSection() {
        return (
            <TopSectionStyled>
                <TopBarStyled>
                    <Flex>
                        <ButtonStyled>
                            {' '}
                            <SearchIcon />{' '}
                        </ButtonStyled>
                        <SearchInputStyled
                            type="input"
                            name="query"
                            autoComplete="off"
                            placeholder="Search Annotations"
                            onChange={this.handleSearchChange}
                            defaultValue={this.state.searchText}
                            specialHandlers={[this.searchEnterHandler]}
                        />
                        {this.state.searchText !== '' && (
                            <CloseButtonStyled onClick={this.handleSearchClear}>
                                <CloseIconStyled />
                                Clear search
                            </CloseButtonStyled>
                        )}
                    </Flex>
                </TopBarStyled>
            </TopSectionStyled>
        )
    }

    handleClickOutside: React.MouseEventHandler = (e) => {
        if (this.props.onClickOutside) {
            return this.props.onClickOutside(e)
        }
    }

    private renderNewAnnotation() {
        if (this.props.notesType === 'shared') {
            return null
        }

        return (
            <NewAnnotationSection>
                <NewAnnotationBoxStyled>
                    <AnnotationCreate
                        {...this.props.annotationCreateProps}
                        ref={(ref) => (this.annotationCreateRef = ref)}
                        autoFocus
                    />
                </NewAnnotationBoxStyled>
            </NewAnnotationSection>
        )
    }

    private renderLoader = (key?: string) => (
        <LoadingIndicatorContainer key={key}>
            <LoadingIndicatorStyled />
        </LoadingIndicatorContainer>
    )

    private renderFollowedListNotes(listId: string) {
        const list = this.props.followedLists.byId[listId]
        if (!list.isExpanded || list.loadState === 'pristine') {
            return null
        }

        if (list.loadState === 'running') {
            return this.renderLoader()
        }

        const annotationsData = list.sharedAnnotationReferences
            .map((ref) => this.props.followedAnnotations[ref.id])
            .filter((a) => !!a)

        if (!annotationsData.length) {
            return 'No notes exist in this list for this page'
        }

        return (
            <FollowedNotesContainer>
                {annotationsData.map((noteData) => (
                    <div>
                        <div>{noteData.body}</div>
                        <div>{noteData.comment}</div>
                        <div>created: {noteData.createdWhen}</div>
                    </div>
                ))}
            </FollowedNotesContainer>
        )
    }

    private renderSharedNotesByList() {
        if (this.props.followedListLoadState === 'running') {
            return this.renderLoader()
        }

        return (
            <FollowedListsContainer>
                {this.props.followedLists.allIds.map((listId) => {
                    const listData = this.props.followedLists.byId[listId]
                    return (
                        <React.Fragment key={listId}>
                            <FollowedListRow>
                                <FollowedListTitleContainer>
                                    <FollowedListTitle>
                                        {listData.name}
                                    </FollowedListTitle>
                                    <FollowedListNoteCount>
                                        {
                                            listData.sharedAnnotationReferences
                                                .length
                                        }
                                    </FollowedListNoteCount>
                                    <Icon
                                        icon="triangle"
                                        height="10px"
                                        onClick={() =>
                                            this.props.expandFollowedListNotes(
                                                listId,
                                            )
                                        }
                                    />
                                </FollowedListTitleContainer>
                                <Icon icon="goTo" height="10px" />
                            </FollowedListRow>
                            {this.renderFollowedListNotes(listId)}
                        </React.Fragment>
                    )
                })}
            </FollowedListsContainer>
        )
    }

    private renderResultsBody() {
        if (this.props.isSearchLoading) {
            return this.renderLoader()
        }

        if (this.props.notesType === 'shared') {
            return this.renderSharedNotesByList()
        }

        return (
            <AnnotationsSectionStyled>
                {this.renderAnnotationsEditable()}
            </AnnotationsSectionStyled>
        )
    }

    private renderAnnotationsEditable() {
        if (!this.props.annotations.length) {
            return <EmptyMessage />
        }

        const annots = this.props.annotations.map((annot, i) => (
            <AnnotationEditable
                key={i}
                {...annot}
                {...this.props}
                sharingAccess={this.props.sharingAccess}
                mode={this.props.annotationModes[annot.url]}
                sharingInfo={this.props.annotationSharingInfo[annot.url]}
                isActive={this.props.activeAnnotationUrl === annot.url}
                onHighlightClick={this.props.setActiveAnnotationUrl(annot.url)}
                annotationEditDependencies={this.props.bindAnnotationEditProps(
                    annot,
                )}
                annotationFooterDependencies={this.props.bindAnnotationFooterEventProps(
                    annot,
                )}
                isClickable={
                    this.props.theme.canClickAnnotations &&
                    annot.body?.length > 0
                }
            />
        ))

        if (this.props.needsWaypoint) {
            annots.push(
                <Waypoint
                    key="sidebar-pagination-waypoint"
                    onEnter={this.props.handleScrollPagination}
                />,
            )
        }

        if (this.props.appendLoader) {
            annots.push(this.renderLoader('sidebar-pagination-spinner'))
        }

        if (this.props.showCongratsMessage) {
            annots.push(<CongratsMessage key="sidebar-congrats-msg" />)
        }

        return annots
    }

    render() {
        return (
            <>
                {/* {this.renderSearchSection()} */}
                {this.renderNewAnnotation()}
                {this.renderResultsBody()}
            </>
        )
    }
}

export default onClickOutside(AnnotationsSidebar)

/// Search bar
// TODO: Move icons to styled components library, refactored shared css

const ButtonStyled = styled.button`
    cursor: pointer;
    z-index: 3000;
    line-height: normal;
    background: transparent;
    border: none;
    outline: none;
`

const SearchIcon = styled.span`
    background-image: url('/img/searchIcon.svg');
    background-size: 15px;
    display: block;
    background-repeat: no-repeat;
    width: 29px;
    height: 29px;
    background-position: center;
    border-radius: 50%;
    background-color: transparent;
`

const SearchInputStyled = styled(TextInputControlled)`
    color: ${(props) => props.theme.colors.primary};
    border-radius: 3px;
    font-size: 14px;
    font-weight: 400;
    text-align: left;
    width: 100%;
    height: 30px;
    border: none;
    outline: none;
    background-color: transparent;

    &::placeholder {
        color: ${(props) => props.theme.colors.primary};
        font-weight: 500;
        opacity: 0.7;
    }

    &:focus {
        outline: none;
        border: none;
        box-shadow: none;
    }
    padding: 5px 0px;
`

const FollowedNotesContainer = styled.div`
    display: flex;
    flex-direction: column;
`

const FollowedListsContainer = styled.div`
    display: flex;
    flex-direction: column;
`

const FollowedListRow = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    width: 100%;
`

const FollowedListTitleContainer = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
`

const FollowedListTitle = styled.span`
    font-weight: bold;
`

const FollowedListNoteCount = styled.span`
    font-weight: bold;
`

const CloseIconStyled = styled.div`
    mask-position: center;
    mask-repeat: no-repeat;
    mask-size: 100%;
    background-color: ${(props) => props.theme.colors.primary};
    mask-image: url('/img/close.svg');
    background-size: 12px;
    display: block;
    cursor: pointer;
    background-repeat: no-repeat;
    width: 100%;
    height: 100%;
    background-position: center;
    border-radius: 3px;
`

const CloseButtonStyled = styled.button`
    cursor: pointer;
    z-index: 2147483647;
    line-height: normal;
    background: transparent;
    border: none;
    outline: none;
`

const TopBarStyled = styled.div`
    position: static;
    top: 0;
    background: #f6f8fb;
    display: flex;
    justify-content: space-between;
    align-items: center;
    z-index: 2147483647;
    padding: 7px 8px 5px 3px;
    height: 40px;
    box-sizing: border-box;
    width: 100%;
`

const LoadingIndicatorContainer = styled.div`
    width: 100%;
    height: 100px;
    display: flex;
    justify-content: center;
    align-items: center;
`

const LoadingIndicatorStyled = styled(LoadingIndicator)`
    width: 100%;
    display: flex;
    height: 50px;
    margin: 30px 0;
    justify-content: center;
`

const annotationCardStyle = css`
    border-radius: 3px;
    box-shadow: rgba(15, 15, 15, 0.1) 0px 0px 0px 1px,
        rgba(15, 15, 15, 0.1) 0px 2px 4px;
    transition: background 120ms ease-in 0s;
    background: white;

    &:hover {
        transition: background 120ms ease-in 0s;
        background-color: rgba(55, 53, 47, 0.03);
    }
`

const NewAnnotationSection = styled.section`
    font-family: sans-serif;
    height: auto;
    background: #f6f8fb;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: flex-start;
    padding: 10px 10px 0px 10px;
`

const NewAnnotationSeparator = styled.div`
    align-self: center;
    width: 60%;
    margin-top: 20px;
    border-bottom: 1px solid #e0e0e0;
`

const AnnotationsSectionStyled = styled.section`
    font-family: sans-serif;
    background: #f6f8fb;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: flex-start;
    margin-bottom: 30px;
    padding: 15px 10px 100px;
`

const NewAnnotationBoxStyled = styled.div`
    position: relative;
    width: 100%;

    &:hover {
        background: white;
    }
`

const TopSectionStyled = styled.div`
    position: sticky;
    top: 0px;
    z-index: 2600;
    background: white;
    overflow: hidden;
    padding: 0 5px;
`

const EmptyMessage = () => (
    <EmptyMessageStyled>
        <EmptyMessageEmojiStyled>¯\_(ツ)_/¯</EmptyMessageEmojiStyled>
        <EmptyMessageTextStyled>
            No notes or highlights on this page
        </EmptyMessageTextStyled>
    </EmptyMessageStyled>
)

const EmptyMessageStyled = styled.div`
    width: 80%;
    margin: 0px auto;
    text-align: center;
    margin-top: 90px;
    animation: onload 0.3s cubic-bezier(0.65, 0.05, 0.36, 1);
`

const EmptyMessageEmojiStyled = styled.div`
    font-size: 20px;
    margin-bottom: 15px;
    color: rgb(54, 54, 46);
`

const EmptyMessageTextStyled = styled.div`
    margin-bottom: 15px;
    font-weight: 400;
    font-size: 15px;
    color: #a2a2a2;
`
