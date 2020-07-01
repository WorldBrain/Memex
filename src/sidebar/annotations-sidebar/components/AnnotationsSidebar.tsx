import * as React from 'react'
import Waypoint from 'react-waypoint'
import styled, { css } from 'styled-components'

import LoadingIndicator from 'src/common-ui/components/LoadingIndicator'
import AnnotationCreate, {
    AnnotationCreateProps,
} from 'src/annotations/components/AnnotationCreate'
import AnnotationEditable, {
    Props as AnnotationEditableProps,
} from 'src/annotations/components/AnnotationEditable'
import TextInputControlled from 'src/common-ui/components/TextInputControlled'
import { Flex } from 'src/common-ui/components/design-library/Flex'
import { Annotation } from 'src/annotations/types'
import { TaskState } from 'ui-logic-react/lib/types'
import CongratsMessage from 'src/annotations/components/parts/CongratsMessage'

export interface AnnotationsSidebarProps {
    // setEventEmitter: (events: AnnotationsSidebarEventEmitter) => void

    // NOTE: This group of props were all brought over from AnnotationsEditable
    showCongratsMessage?: boolean
    activeAnnotationUrl?: string | null
    hoverAnnotationUrl?: string
    needsWaypoint?: boolean
    appendLoader?: boolean
    handleScrollPagination?: () => void
    // ^ Until here ^

    onSearch: (search) => void
    isSearchLoading: TaskState
    annotationCreateProps: AnnotationCreateProps
    annotationEditProps: AnnotationEditableProps
    isAnnotationCreateShown: boolean
    annotations: Annotation[]

    //
    // loadState?: TaskState
    // searchLoadState?: TaskState
    // isOpen?: boolean // TODO: move this to wrapper component
    //
    //
    // // TODO: things like go to highlight on page should fire an event up
    // and be caught by a wrapper component (may do different things in page, on dashboard, etc)
    // highlighter?: Pick<HighlightInteractionInterface, 'removeTempHighlights'>
    //
    // annotationsStorage?: AnnotationStorageInterface
}

interface AnnotationsSidebarState {
    searchText?: string
}

export default class AnnotationsSidebar extends React.Component<
    AnnotationsSidebarProps,
    AnnotationsSidebarState
> {
    state = {
        searchText: '',
    }

    render() {
        return (
            <SidebarStyled>
                {this.renderSearchSection()}
                {this.renderNewAnnotation()}
                {this.renderResultsBody()}
            </SidebarStyled>
        )
    }
    private renderSearchSection() {
        const searchEnterHandler = {
            test: (e) => e.key === 'Enter',
            handle: this.handleSearchEnter,
        }

        return (
            <TopSectionStyled>
                <TopBarStyled>
                    <Flex>
                        <ButtonStyled>
                            {' '}
                            <SearchIcon />{' '}
                        </ButtonStyled>
                        <SearchInputStyled
                            autoFocus={true}
                            name="query"
                            placeholder="Search Annotations"
                            autoComplete="off"
                            onChange={this.handleSearchChange}
                            specialHandlers={[searchEnterHandler]}
                            defaultValue={this.state.searchText}
                            type={'input'}
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

    handleSearchChange = (searchText) => {
        this.setState({ searchText })
    }

    handleSearchEnter = () => {
        this.props.onSearch(this.state.searchText)
    }

    handleSearchClear = () => {
        this.setState({ searchText: '' })
        this.props.onSearch('')
    }

    private renderNewAnnotation() {
        return (
            this.props.isAnnotationCreateShown && (
                <NewAnnotationBoxStyled>
                    <AnnotationCreate {...this.props.annotationCreateProps} />
                </NewAnnotationBoxStyled>
            )
        )
    }

    private renderAnnotationsEditable() {
        const { annotations } = this.props

        if (!annotations.length) {
            return <EmptyMessage />
        }

        const annots = this.props.annotations.map((annot, i) => (
            <AnnotationEditable
                key={i}
                {...this.props.annotationEditProps}
                displayCrowdfunding={false}
                {...annot}
                isActive={this.props.activeAnnotationUrl === annot.url}
                isHovered={this.props.hoverAnnotationUrl === annot.url}
            />
        ))

        if (this.props.needsWaypoint) {
            annots.push(
                <Waypoint
                    onEnter={() => this.props.handleScrollPagination}
                    key="sidebar-waypoint"
                />,
            )
        }

        if (this.props.appendLoader) {
            annots.push(<LoadingIndicator key="spinner" />)
        }

        if (this.props.showCongratsMessage) {
            annots.push(<CongratsMessage />)
        }

        return annots
    }

    private renderResultsBody() {
        return (
            <AnnotationsSectionStyled>
                {this.props.isSearchLoading === 'running' && (
                    <LoadingIndicatorStyled />
                )}
                {this.renderAnnotationsEditable()}
            </AnnotationsSectionStyled>
        )
    }
}

/// Search bar
// TODO: Move icons to styled components library, refactored shared css
const ButtonStyled = styled.button`
    cursor: pointer;
    z-index: 2147483647;
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
    color: #3a2f45;
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
        color: #3a2f45;
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

const CloseIconStyled = styled.div`
    mask-position: center;
    mask-repeat: no-repeat;
    mask-size: 16px;
    background-color: #3a2f45;
    mask-image: url('/img/close.svg');
    background-size: 12px;
    display: block;
    cursor: pointer;
    background-repeat: no-repeat;
    width: 22px;
    height: 22px;
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

///
const SidebarStyled = styled.div``

const TopBarStyled = styled.div`
    position: sticky;
    top: 0;
    background: #fff;
    display: flex;
    justify-content: space-between;
    align-items: center;
    z-index: 2147483647;
    padding: 7px 8px 5px 3px;
    height: 40px;
    box-sizing: border-box;
    margin-top: 3px;
`

const LoadingIndicatorStyled = styled(LoadingIndicator)`
    width: 100%;
    display: flex;
    height: 50px;
    margin: 30px 0;
    justify-content: center;
`

const AnnotationsSectionStyled = styled.section`
    width: 100%;
    background: #fff;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
    margin-bottom: 30px;
`

const annotationCardStyle = css`
    border-radius: 3px;
    box-shadow: rgba(15, 15, 15, 0.1) 0px 0px 0px 1px,
        rgba(15, 15, 15, 0.1) 0px 2px 4px;
    transition: background 120ms ease-in 0s;

    &:hover {
        transition: background 120ms ease-in 0s;
        background-color: rgba(55, 53, 47, 0.03);
    }
`

const NewAnnotationBoxStyled = styled.div`
    ${annotationCardStyle}

    background: white;
    border-radius: 3px;
    top: 10px;
    margin: 0 10px 40px;
    position: relative;
    width: 93%;

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
