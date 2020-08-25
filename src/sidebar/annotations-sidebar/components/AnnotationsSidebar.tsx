import * as React from 'react'
import Waypoint from 'react-waypoint'
import styled, { css } from 'styled-components'
import onClickOutside from 'react-onclickoutside'

import LoadingIndicator from 'src/common-ui/components/LoadingIndicator'
import AnnotationCreate, {
    AnnotationCreateGeneralProps,
    AnnotationCreateEventProps,
} from 'src/annotations/components/AnnotationCreate'
import AnnotationEditable, {
    AnnotationEditableGeneralProps,
    AnnotationEditableEventProps,
} from 'src/annotations/components/AnnotationEditable'
import TextInputControlled from 'src/common-ui/components/TextInputControlled'
import { Flex } from 'src/common-ui/components/design-library/Flex'
import { Annotation } from 'src/annotations/types'
import CongratsMessage from 'src/annotations/components/parts/CongratsMessage'
import { AnnotationMode, SidebarTheme } from '../types'
import { GenericPickerDependenciesMinusSave } from 'src/common-ui/GenericPicker/logic'
import { AnnotationFooterEventProps } from 'src/annotations/components/AnnotationFooter'
import {
    AnnotationEditGeneralProps,
    AnnotationEditEventProps,
} from 'src/annotations/components/AnnotationEdit'
import {
    AnnotationSharingInfo,
    AnnotationSharingAccess,
} from 'src/content-sharing/ui/types'

export interface AnnotationsSidebarProps {
    annotationModes: { [url: string]: AnnotationMode }
    annotationSharingInfo: { [annotationUrl: string]: AnnotationSharingInfo }

    showCongratsMessage?: boolean
    activeAnnotationUrl?: string | null
    hoverAnnotationUrl?: string
    needsWaypoint?: boolean
    appendLoader?: boolean
    handleScrollPagination: () => void

    renderCopyPasterForAnnotation: (id: string) => JSX.Element
    onClickOutside: React.MouseEventHandler
    bindAnnotationFooterEventProps: (
        annotation: Annotation,
    ) => AnnotationFooterEventProps
    bindAnnotationEditProps: (
        annotation: Annotation,
    ) => AnnotationEditGeneralProps & AnnotationEditEventProps
    annotationEditableProps: AnnotationEditableGeneralProps &
        AnnotationEditableEventProps
    annotationCreateProps: AnnotationCreateGeneralProps &
        AnnotationCreateEventProps
    annotationTagProps: GenericPickerDependenciesMinusSave

    sharingAccess: AnnotationSharingAccess
    isSearchLoading: boolean
    isAnnotationCreateShown: boolean
    activeCopyPasterAnnotationId?: string
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
    state = {
        searchText: '',
    }

    componentDidMount() {
        document.addEventListener('keydown', this.onKeydown, false)
    }

    componentWillUnmount() {
        document.removeEventListener('keydown', this.onKeydown, false)
    }

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
                            autoFocus
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

    render() {
        return (
            <>
                {/* {this.renderSearchSection()} */}
                {this.renderNewAnnotation()}
                {this.renderResultsBody()}
            </>
        )
    }

    private renderNewAnnotation() {
        if (!this.props.isAnnotationCreateShown) {
            return
        }

        return (
            <NewAnnotationSection>
                <NewAnnotationStyled>New Annotation</NewAnnotationStyled>
                <NewAnnotationBoxStyled>
                    <AnnotationCreate
                        {...this.props.annotationCreateProps}
                        tagPickerDependencies={this.props.annotationTagProps}
                    />
                </NewAnnotationBoxStyled>
                <NewAnnotationSeparator />
            </NewAnnotationSection>
        )
    }

    private renderResultsBody() {
        return (
            <>
                {this.props.isSearchLoading ? (
                    <LoadingIndicatorContainer>
                        <LoadingIndicatorStyled />
                    </LoadingIndicatorContainer>
                ) : (
                    <AnnotationsSectionStyled>
                        {this.renderAnnotationsEditable()}
                    </AnnotationsSectionStyled>
                )}
            </>
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
                {...this.props.annotationEditableProps}
                sharingAccess={this.props.sharingAccess}
                mode={this.props.annotationModes[annot.url]}
                sharingInfo={this.props.annotationSharingInfo[annot.url]}
                isActive={this.props.activeAnnotationUrl === annot.url}
                isHovered={this.props.hoverAnnotationUrl === annot.url}
                tagPickerDependencies={this.props.annotationTagProps}
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
            annots.push(
                <LoadingIndicatorContainer key="sidebar-pagination-spinner">
                    <LoadingIndicator />
                </LoadingIndicatorContainer>,
            )
        }

        if (this.props.showCongratsMessage) {
            annots.push(<CongratsMessage key="sidebar-congrats-msg" />)
        }

        return annots
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

const NewAnnotationStyled = styled.div`
    font-weight: 600;
    color: #3a2f45;
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
    mask-size: 100%;
    background-color: #3a2f45;
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
    background: #fff;
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
    background: #fff;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: flex-start;
    padding: 30px 5px 0px 5px;
`

const NewAnnotationSeparator = styled.div`
    align-self: center;
    width: 60%;
    margin-top: 30px;
    border-bottom: 1px solid #e0e0e0;
`

const AnnotationsSectionStyled = styled.section`
    font-family: sans-serif;
    background: #fff;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: flex-start;
    margin-bottom: 30px;
    padding: 15px 5px 100px;
`

const NewAnnotationBoxStyled = styled.div`
    ${annotationCardStyle}
    margin: 10px 0 5px 0;
    position: relative;
    width: 97%;

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
