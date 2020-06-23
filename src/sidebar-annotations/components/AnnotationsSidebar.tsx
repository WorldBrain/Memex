import * as React from 'react'
import { TopbarState } from './topbar'
import { ResultsContainerProps } from './results-container'
import LoadingIndicator from 'src/common-ui/components/LoadingIndicator'
import { HighlightInteractionInterface } from 'src/highlighting/types'
import { TaskState } from 'ui-logic-core/lib/types'
import styled, { css } from 'styled-components'
import SearchBox from 'src/sidebar-annotations/components/top-bar/search-box'
import TypedEventEmitter from 'typed-emitter'
import AnnotationsList from 'src/sidebar-annotations/components/annotations-list/AnnotationsList'
import { PageAnnotationsProps } from 'src/annotations/components/page-annotations'
import AnnotationCreate from 'src/annotations/components/AnnotationCreate'

interface AnnotationsSidebarEvents {
    handleCloseSidebar: () => void
}
type AnnotationsSidebarEventEmitter = TypedEventEmitter<
    AnnotationsSidebarEvents
>

export interface AnnotationsSidebarProps {
    // setEventEmitter: (events: AnnotationsSidebarEventEmitter) => void

    loadState: TaskState
    searchLoadState: TaskState
    isOpen: boolean
    shouldShowCreateAnnotation: boolean

    searchValue: string
    createAnnotationBoxProps: CreateAnnotationBoxProps
    pageAnnotations: PageAnnotationsProps

    highlighter: Pick<HighlightInteractionInterface, 'removeTempHighlights'>
    onSearchEnter: (searchValue: string) => void
    onSearchChange: (searchValue: string) => void

    resultsContainer: ResultsContainerProps
    topBar: TopbarState
}

export default class AnnotationsSidebar extends React.Component<
    AnnotationsSidebarProps
> {
    private handleSearchEnter = (
        e: React.SyntheticEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => this.props.onSearchEnter(this.props.searchValue)

    private handleSearchClearBtn = (e: React.MouseEvent<HTMLButtonElement>) => {
        this.props.onSearchChange('')
    }

    render() {
        return (
            <SidebarStyled>
                <TopSectionStyled>
                    <TopBarStyled>
                        <SearchBox
                            placeholder="Search Annotations"
                            searchValue={this.props.searchValue}
                            onSearchChange={this.props.onSearchChange}
                            onSearchEnter={this.handleSearchEnter}
                            onSearchClearBtn={this.handleSearchClearBtn}
                        />
                    </TopBarStyled>
                </TopSectionStyled>

                {this.props.shouldShowCreateAnnotation && (
                    <CreateAnnotationBoxStyled>
                        <AnnotationCreate
                            {...this.props.createAnnotationBoxProps}
                        />
                    </CreateAnnotationBoxStyled>
                )}

                <AnnotationsSectionStyled>
                    {this.props.searchLoadState === 'running' && (
                        <LoadingIndicatorStyled />
                    )}
                    <AnnotationsList {...this.props.pageAnnotations} />
                </AnnotationsSectionStyled>
            </SidebarStyled>
        )
    }
}

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

const CreateAnnotationBoxStyled = styled.div`
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
