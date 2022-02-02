import * as React from 'react'
import Waypoint from 'react-waypoint'
import styled, { css } from 'styled-components'
import onClickOutside from 'react-onclickoutside'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import { ConversationReplies } from '@worldbrain/memex-common/lib/content-conversations/ui/components/annotations-in-page'
import type { SharedAnnotationReference } from '@worldbrain/memex-common/lib/content-sharing/types'
import type { NewReplyEventHandlers } from '@worldbrain/memex-common/lib/content-conversations/ui/components/new-reply'
import { ButtonTooltip } from 'src/common-ui/components'
import LoadingIndicator from 'src/common-ui/components/LoadingIndicator'
import AnnotationCreate, {
    Props as AnnotationCreateProps,
} from 'src/annotations/components/AnnotationCreate'
import AnnotationEditable from 'src/annotations/components/HoverControlledAnnotationEditable'
import TextInputControlled from 'src/common-ui/components/TextInputControlled'
import { Flex } from 'src/common-ui/components/design-library/Flex'
import type { Annotation } from 'src/annotations/types'
import CongratsMessage from 'src/annotations/components/parts/CongratsMessage'
import type { AnnotationMode, SidebarTheme } from '../types'
import { AnnotationFooterEventProps } from 'src/annotations/components/AnnotationFooter'
import {
    AnnotationEditGeneralProps,
    AnnotationEditEventProps,
} from 'src/annotations/components/AnnotationEdit'
import type { AnnotationSharingAccess } from 'src/content-sharing/ui/types'
import type { SidebarContainerState } from '../containers/types'
import { ExternalLink } from 'src/common-ui/components/design-library/actions/ExternalLink'
import Margin from 'src/dashboard-refactor/components/Margin'
import { SortingDropdownMenuBtn } from '../components/SortingDropdownMenu'
import * as icons from 'src/common-ui/components/design-library/icons'
import AllNotesShareMenu from 'src/overview/sharing/AllNotesShareMenu'
import { PageNotesCopyPaster } from 'src/copy-paster'
import { HoverBox } from 'src/common-ui/components/design-library/HoverBox'
import { normalizeUrl } from '@worldbrain/memex-url-utils'
import { ClickAway } from 'src/util/click-away-wrapper'

export interface AnnotationsSidebarProps
    extends Omit<SidebarContainerState, 'annotationModes'> {
    annotationModes: { [url: string]: AnnotationMode }

    setActiveAnnotationUrl?: (url: string) => React.MouseEventHandler

    bindSharedAnnotationEventHandlers: (
        sharedAnnotationReference: SharedAnnotationReference,
    ) => {
        onReplyBtnClick: React.MouseEventHandler
    } & NewReplyEventHandlers

    handleScrollPagination: () => void
    needsWaypoint?: boolean
    appendLoader?: boolean

    renderCopyPasterForAnnotation: (id: string) => JSX.Element
    renderTagsPickerForAnnotation: (id: string) => JSX.Element
    renderShareMenuForAnnotation: (id: string) => JSX.Element

    expandMyNotes: () => void
    expandSharedSpaces: (listIds: string[]) => void
    expandFollowedListNotes: (listId: string) => void

    onClickOutside: React.MouseEventHandler
    bindAnnotationFooterEventProps: (
        annotation: Annotation,
    ) => AnnotationFooterEventProps & {
        onGoToAnnotation?: React.MouseEventHandler
    }
    bindAnnotationEditProps: (
        annotation: Annotation,
    ) => AnnotationEditGeneralProps & AnnotationEditEventProps
    annotationCreateProps: AnnotationCreateProps

    sharingAccess: AnnotationSharingAccess
    isSearchLoading: boolean
    isAnnotationCreateShown: boolean
    annotations: Annotation[]
    theme: Partial<SidebarTheme>
    openCollectionPage: (remoteListId: string) => void
    onShareAllNotesClick: () => void
    onCopyBtnClick: () => void
    onMenuItemClick: (sortingFn) => void
    copyPaster: any
    onClickOutsideCopyPaster: () => void
    normalizedPageUrls: string[]
    normalizedPageUrl?: string
    annotationUrls: () => void
    contentSharing: any
    annotationsShareAll: any
    copyPageLink: any
    postShareHook: (shareInfo) => void
    sidebarContext?: string
}

interface AnnotationsSidebarState {
    searchText?: string
    isMarkdownHelpShown?: boolean
    showAllNotesCopyPaster?: boolean
    showAllNotesShareMenu?: boolean
}

class AnnotationsSidebar extends React.Component<
    AnnotationsSidebarProps,
    AnnotationsSidebarState
> {
    private annotationCreateRef // TODO: Figure out how to properly type refs to onClickOutside HOCs
    private annotationEditRef

    state = {
        searchText: '',
        isMarkdownHelpShown: false,
        showAllNotesCopyPaster: false,
        showAllNotesShareMenu: false,
    }

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
        e.stopPropagation()
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

    private renderCopyPasterManager(annotationUrls) {
        return (
            <HoverBox>
                <PageNotesCopyPaster
                    copyPaster={this.props.copyPaster}
                    annotationUrls={annotationUrls}
                    normalizedPageUrls={this.props.normalizedPageUrls}
                    onClickOutside={() =>
                        this.setState({ showAllNotesCopyPaster: false })
                    }
                />
            </HoverBox>
        )
    }

    private renderAllNotesCopyPaster() {
        if (!this.state.showAllNotesCopyPaster) {
            return null
        }

        const annotUrls = this.props.annotationUrls()
        return (
            <CopyPasterWrapperTopBar>
                {this.renderCopyPasterManager(annotUrls)}
            </CopyPasterWrapperTopBar>
        )
    }

    private renderAllNotesShareMenu() {
        if (!this.state.showAllNotesShareMenu) {
            return null
        }

        return (
            <ShareMenuWrapperTopBar>
                <ClickAway
                    onClickAway={() =>
                        this.setState({ showAllNotesShareMenu: false })
                    }
                >
                    <HoverBox width="340px">
                        <AllNotesShareMenu
                            contentSharingBG={this.props.contentSharing}
                            annotationsBG={this.props.annotationsShareAll}
                            normalizedPageUrl={this.props.normalizedPageUrl}
                            copyLink={async (link) => {
                                this.props.copyPageLink(link)
                            }}
                            postShareHook={(shareInfo) =>
                                this.props.postShareHook(shareInfo)
                            }
                        />
                    </HoverBox>
                </ClickAway>
            </ShareMenuWrapperTopBar>
        )
    }

    private renderNewAnnotation() {
        return (
            <NewAnnotationSection>
                <AnnotationCreate
                    {...this.props.annotationCreateProps}
                    ref={this.annotationCreateRef}
                    autoFocus
                />
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
        if (!list.isExpanded || list.annotationsLoadState === 'pristine') {
            return null
        }

        if (list.annotationsLoadState === 'running') {
            return this.renderLoader()
        }

        if (list.annotationsLoadState === 'error') {
            return (
                <FollowedListsMsgContainer>
                    <FollowedListsMsgHead>
                        Something went wrong
                    </FollowedListsMsgHead>
                    <FollowedListsMsg>
                        Reload the page and if the problem persists{' '}
                        <ExternalLink
                            label="contact support"
                            href="mailto:support@worldbrain.io"
                        />
                        .
                    </FollowedListsMsg>
                </FollowedListsMsgContainer>
            )
        }

        const annotationsData = list.sharedAnnotationReferences
            .map((ref) => this.props.followedAnnotations[ref.id])
            .filter((a) => !!a)

        if (!annotationsData.length) {
            return 'No notes exist in this list for this page'
        }

        return (
            <FollowedNotesContainer>
                {annotationsData.map((data) => {
                    const conversation = this.props.conversations[data.id]
                    const sharedAnnotationRef: SharedAnnotationReference = {
                        id: data.id,
                        type: 'shared-annotation-reference',
                    }
                    const eventHandlers = this.props.bindSharedAnnotationEventHandlers(
                        sharedAnnotationRef,
                    )
                    return (
                        <React.Fragment key={data.id}>
                            <AnnotationEditable
                                isShared
                                isBulkShareProtected
                                url={data.id}
                                body={data.body}
                                comment={data.comment}
                                lastEdited={data.updatedWhen}
                                createdWhen={data.createdWhen}
                                creatorDependencies={
                                    this.props.users[data.creatorId]
                                }
                                isActive={
                                    this.props.activeAnnotationUrl === data.id
                                }
                                onReplyBtnClick={eventHandlers.onReplyBtnClick}
                                onHighlightClick={this.props.setActiveAnnotationUrl(
                                    data.id,
                                )}
                                isClickable={
                                    this.props.theme.canClickAnnotations &&
                                    data.body?.length > 0
                                }
                                repliesLoadingState={
                                    list.conversationsLoadState
                                }
                                hasReplies={
                                    conversation?.thread != null ||
                                    conversation?.replies.length > 0
                                }
                            />
                            <ConversationReplies
                                {...eventHandlers}
                                conversation={conversation}
                                annotation={{
                                    body: data.body,
                                    linkId: data.id,
                                    comment: data.comment,
                                    createdWhen: data.createdWhen,
                                    reference: sharedAnnotationRef,
                                }}
                            />
                        </React.Fragment>
                    )
                })}
            </FollowedNotesContainer>
        )
    }

    private renderSharedNotesByList() {
        const { followedLists } = this.props

        // if (!followedLists.allIds.length) {
        //     return null
        // }

        const sharedNotesByList = followedLists.allIds.map((listId) => {
            const listData = followedLists.byId[listId]
            return (
                <FollowedListNotesContainer bottom="20px" top="-15px">
                    {/* <React.Fragment key={listId}> */}
                    <FollowedListRow
                        key={listId}
                        onClick={() =>
                            this.props.expandFollowedListNotes(listId)
                        }
                        title={listData.name}
                    >
                        <FollowedListTitleContainer>
                            <FollowedListTitle>
                                {listData.name}
                            </FollowedListTitle>
                        </FollowedListTitleContainer>
                        <ButtonContainer>
                            <ButtonTooltip
                                tooltipText="Go to Space"
                                position="left"
                            >
                                <Icon
                                    icon="goTo"
                                    height="16px"
                                    onClick={() =>
                                        this.props.openCollectionPage(listId)
                                    }
                                />
                            </ButtonTooltip>
                            <FollowedListNoteCount active left="5px">
                                {listData.sharedAnnotationReferences.length}
                            </FollowedListNoteCount>
                        </ButtonContainer>
                    </FollowedListRow>
                    {this.renderFollowedListNotes(listId)}
                </FollowedListNotesContainer>
            )
        })
        return (
            <SectionTitleContainer>
                {this.props.isExpandedSharedSpaces &&
                    (this.props.followedListLoadState === 'running' ? (
                        this.renderLoader()
                    ) : this.props.followedListLoadState === 'error' ? (
                        <FollowedListsMsgContainer>
                            <FollowedListsMsgHead>
                                Something went wrong
                            </FollowedListsMsgHead>
                            <FollowedListsMsg>
                                Reload the page and if the problem persists{' '}
                                <ExternalLink
                                    label="contact
                                    support"
                                    href="mailto:support@worldbrain.io"
                                />
                                .
                            </FollowedListsMsg>
                        </FollowedListsMsgContainer>
                    ) : (
                        sharedNotesByList
                    ))}
            </SectionTitleContainer>
        )
    }

    private renderResultsBody() {
        if (this.props.isSearchLoading) {
            return this.renderLoader()
        }
        return (
            <React.Fragment>
                <AnnotationsSectionStyled>
                    {this.renderAnnotationsEditable()}
                </AnnotationsSectionStyled>
                <AnnotationsSectionStyled>
                    {this.renderSharedNotesByList()}
                </AnnotationsSectionStyled>
            </React.Fragment>
        )
    }

    private renderAnnotationsEditable() {
        const annots = this.props.annotations.map((annot, i) => {
            const footerDeps = this.props.bindAnnotationFooterEventProps(annot)
            return (
                <>
                    <AnnotationEditable
                        key={i}
                        {...annot}
                        {...this.props}
                        body={annot.body}
                        comment={annot.comment}
                        createdWhen={annot.createdWhen!}
                        isShared={annot.isShared}
                        isBulkShareProtected={annot.isBulkShareProtected}
                        mode={this.props.annotationModes[annot.url]}
                        isActive={this.props.activeAnnotationUrl === annot.url}
                        onHighlightClick={this.props.setActiveAnnotationUrl(
                            annot.url,
                        )}
                        onGoToAnnotation={footerDeps.onGoToAnnotation}
                        annotationEditDependencies={this.props.bindAnnotationEditProps(
                            annot,
                        )}
                        annotationFooterDependencies={footerDeps}
                        isClickable={
                            this.props.theme.canClickAnnotations &&
                            annot.body?.length > 0
                        }
                        ref={(ref) => (this.annotationEditRef = ref)}
                    />
                </>
            )
        })

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

        return (
            <SectionTitleContainer
                bottom={this.props.isExpanded ? '20px' : '0px'}
            >
                {!this.props.annotations.length ? (
                    <EmptyMessage />
                ) : (
                    this.props.isExpanded && (
                        <>
                            {this.renderNewAnnotation()}
                            {annots}
                        </>
                    )
                )}
            </SectionTitleContainer>
        )
    }

    private renderTopBarSwitcher() {
        const { followedLists } = this.props
        return (
            <TopBarContainer>
                <FollowedListTitleContainerMyNotes left="5px">
                    <MyNotesClickableArea
                        onClick={
                            !this.props.annotations.length ||
                            this.props.isExpanded
                                ? null
                                : () => {
                                      this.props.expandMyNotes()
                                      this.props.expandSharedSpaces(
                                          followedLists.allIds,
                                      )
                                  }
                        }
                    >
                        <FollowedListSectionTitle
                            active={this.props.isExpanded}
                        >
                            <Icon
                                filePath={icons.personFine}
                                heightAndWidth="18px"
                                hoverOff
                                color={this.props.isExpanded ? 'purple' : null}
                            />
                            My Annotations
                        </FollowedListSectionTitle>
                    </MyNotesClickableArea>
                </FollowedListTitleContainerMyNotes>
                <FollowedListTitleContainer
                    onClick={
                        this.props.isExpandedSharedSpaces
                            ? null
                            : () => {
                                  this.props.expandSharedSpaces(
                                      followedLists.allIds,
                                  )
                                  this.props.expandMyNotes()
                              }
                    }
                    left="5px"
                >
                    <FollowedListSectionTitle
                        active={this.props.isExpandedSharedSpaces}
                    >
                        <Icon
                            filePath={icons.peopleFine}
                            heightAndWidth="18px"
                            hoverOff
                            color={
                                this.props.isExpandedSharedSpaces
                                    ? 'purple'
                                    : null
                            }
                        />
                        Shared Spaces
                    </FollowedListSectionTitle>

                    {this.props.followedListLoadState === 'running' ? (
                        <LoadingBox>
                            <LoadingIndicator size={'16px'} />{' '}
                        </LoadingBox>
                    ) : followedLists.allIds.length ? (
                        <LoadingBox>
                            <FollowedListNoteCount active={true} left="5px">
                                {followedLists.allIds.length}
                            </FollowedListNoteCount>
                        </LoadingBox>
                    ) : (
                        <LoadingBox>
                            <FollowedListNoteCount active={false} left="5px">
                                0
                            </FollowedListNoteCount>
                        </LoadingBox>
                    )}
                </FollowedListTitleContainer>
            </TopBarContainer>
        )
    }

    private renderTopBarActionButtons() {
        return (
            <TopBarActionBtns>
                {this.renderAllNotesShareMenu()}
                {this.renderAllNotesCopyPaster()}
                <SortingDropdownMenuBtn
                    onMenuItemClick={(sortingFn) =>
                        this.props.onMenuItemClick(sortingFn)
                    }
                />
                <ButtonTooltip
                    tooltipText="Copy All Notes"
                    position="bottomSidebar"
                >
                    <Icon
                        filePath={icons.copy}
                        onClick={() =>
                            this.setState({
                                showAllNotesCopyPaster: true,
                            })
                        }
                        heightAndWidth="16px"
                    />
                </ButtonTooltip>
                <ButtonTooltip
                    tooltipText="Share annotated Page"
                    position="bottomRightEdge"
                >
                    <Icon
                        onClick={() =>
                            this.setState({
                                showAllNotesShareMenu: true,
                            })
                        }
                        heightAndWidth="14px"
                        filePath={icons.link}
                    />
                </ButtonTooltip>
            </TopBarActionBtns>
        )
    }

    render() {
        return (
            <>
                <ResultBodyContainer sidebarContext={this.props.sidebarContext}>
                    <TopBar>
                        {this.renderTopBarSwitcher()}
                        {this.props.isExpanded &&
                            this.renderTopBarActionButtons()}
                    </TopBar>
                    {this.renderResultsBody()}
                </ResultBodyContainer>
            </>
        )
    }
}

export default onClickOutside(AnnotationsSidebar)

/// Search bar
// TODO: Move icons to styled components library, refactored shared css

const LoadingBox = styled.div`
    margin-left: 3px;
    width: 30px;
    display: flex;
    justify-content: flex-start;
`

const TopBar = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 40px;
    width: 93%;
    padding: 5px 15px 5px 10px;
    border-bottom: 1px solid ${(props) => props.theme.colors.lightgrey};
`

const TopBarContainer = styled.div`
    display: flex;
    grid-gap: 10px;
    align-items: center;
`

const EmptyMessage = () => (
    <FollowedListsMsgContainer>
        <FollowedListsMsgHead>
            <NoNoteImg src={icons.noNote} />
        </FollowedListsMsgHead>
        <FollowedListsMsg>
            Add a note or highlight sections of the page
        </FollowedListsMsg>
    </FollowedListsMsgContainer>
)

const NoNoteImg = styled.img`
    height: 80px;
    width: 80px;
    display: flex;
    justify-self: center;
`

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

const FollowedListNotesContainer = styled(Margin)`
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: flex-start;
`

const SectionTitleContainer = styled(Margin)`
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: flex-start;
`

const FollowedNotesContainer = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
`

const FollowedListsMsgContainer = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    padding-bottom: 50px;
    flex-direction: column;
`

const FollowedListsMsgHead = styled.span`
    font-weight: bold;
    text-align: center;
    color: ${(props) => props.theme.colors.normalText};
    padding-top: 10px;
    padding-bottom: 5px;
    font-size: 14px;
    line-height: 20px;
    justify-content: center;
    display: grid;
    grid-auto-flow: row;
    align-items: center;
    grid-gap: 5px;
`
const FollowedListsMsg = styled.span`
    color: ${(props) => props.theme.colors.lighterText};
    text-align: center;
    font-size: 14px;
    line-height: 17px;
`

const FollowedListsContainer = styled.div`
    display: flex;
    flex-direction: column;
    padding: 10px 10px 100px 10px;
`

const FollowedListRow = styled(Margin)`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    padding: 5px;
    width: fill-available;
    cursor: pointer;
    box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.05);
    border-radius: 8px;
    height: 40px;
    padding: 5px 15px 5px 20px;
    background: white;
    margin: 10px 0px 0px 0px;
`

const ButtonContainer = styled.div`
    display: flex;
    align-items: center;
    grid-gap: 10px;
`

const FollowedListSectionTitle = styled(Margin)<{ active: boolean }>`
    font-size: 14px;
    color: ${(props) =>
        props.active
            ? props.theme.colors.darkerText
            : props.theme.colors.normalText};
    justify-content: flex-start;
    width: max-content;
    font-weight: 400;
    flex-direction: row;
    grid-gap: 5px;
    align-items: center;

    & * {
        cursor: pointer;
    }
`

const FollowedListTitleContainer = styled(Margin)`
    display: flex;
    flex-direction: row;
    align-items: center;
    cursor: pointer;
    justify-content: flex-start;
`

const FollowedListTitleContainerMyNotes = styled(Margin)`
    display: flex;
    flex-direction: row;
    align-items: center;
    cursor: pointer;
    justify-content: space-between;
    width: fit-content;
    z-index: 1;
`

const FollowedListTitle = styled.span`
    font-weight: bold;
    font-size: 14px;
    white-space: pre;
    max-width: 295px;
    text-overflow: ellipsis;
    overflow-x: hidden;
    color: ${(props) => props.theme.colors.darkerText};
`

const FollowedListNoteCount = styled(Margin)<{ active: boolean }>`
    font-weight: bold;
    border-radius: 30px;
    background-color: ${(props) => props.theme.colors.purple};
    background-color: ${(props) =>
        props.active
            ? props.theme.colors.purple
            : props.theme.colors.lightgrey};
    color: ${(props) =>
        props.active ? 'white' : props.theme.colors.normalText};
    width: 30px;
    font-size: 12px;
`

const FollowedListDropdownIcon = styled(Icon)<{
    isExpanded: boolean
}>`
    transform: ${(props) => (props.isExpanded ? 'none' : 'rotate(-90deg)')};
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
    background: ${(props) => props.theme.colors.backgroundColor};
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
    font-family: 'Inter';
    height: auto;
    background: ${(props) => props.theme.colors.backgroundColor};
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: flex-start;
    width: fill-available;
    margin-bottom: 5px;
    padding-bottom: 5px;
`

const NewAnnotationSeparator = styled.div`
    align-self: center;
    width: 60%;
    margin-top: 20px;
    border-bottom: 1px solid #e0e0e0;
`

const AnnotationsSectionStyled = styled.section`
    font-family: 'Inter';
    background: ${(props) => props.theme.colors.backgroundColor};
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: flex-start;
    padding: 5px 10px;
`

const NewAnnotationBoxStyled = styled.div`
    position: relative;
    width: 100%;
`

const TopSectionStyled = styled.div`
    position: sticky;
    top: 0px;
    z-index: 2600;
    background: white;
    overflow: hidden;
    padding: 0 5px;
`

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

const ActionBtn = styled.button<{ isActive: boolean }>`
    border-radius: 3px;
    padding: 2px;
    width: 24px;
    height: 24px;
    padding: 3px;
    border-radius: 3px;
    background-repeat: no-repeat;
    background-position: center;
    border: none;
    background-color: ${(props) =>
        props.isActive ? '#e0e0e0' : 'transparent'};
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

const ActionIcon = styled.img`
    height: 80%;
    width: auto;
`
const TopBarActionBtns = styled.div`
    display: grid;
    justify-content: space-between;
    align-items: center;
    display: flex;
    gap: 8px;
    height: 24px;
    z-index: 10000;
`

const MyNotesClickableArea = styled.div`
    cursor: pointer;
    display: flex;
    align-items: center;
    width: inherit;
`

const CopyPasterWrapperTopBar = styled.div`
    position: relative;
    right: 200px;
    z-index: 10;
    top: 20px;
`

const ShareMenuWrapperTopBar = styled.div`
    position: relative;
    right: 240px;
    z-index: 10;
    top: 20px;
`

const ResultBodyContainer = styled.div<{ sidebarContext: string }>`
    height: fill-available;
    overflow-y: scroll;
    padding-bottom: 150px;
    width: fill-available;
    padding-right: ${(props) =>
        props.sidebarContext === 'dashboard' ? '0' : '40px'};
    position: absolute;
    margin-right: ${(props) =>
        props.sidebarContext === 'dashboard' ? '0' : '-40px'};

    &::-webkit-scrollbar {
        display: none;
    }

    scrollbar-width: none;
`
