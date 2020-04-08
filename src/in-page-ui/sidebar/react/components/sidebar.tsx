import * as React from 'react'
import Waypoint from 'react-waypoint'
import Menu from 'react-burger-menu/lib/menus/slide'

import Topbar, { TopbarState } from './topbar'
import CongratsMessage from './congrats-message'
import EmptyMessage from './empty-message'
import AnnotationBox from './annotation-box'
import menuStyles from './menu-styles'
import CommentBoxContainer, { CommentBoxProps } from './comment-box/comment-box'
import { Page } from '../types'
import FiltersSidebar, { FiltersSidebarProps } from './filters-sidebar'
import ResultsContainer, { ResultsContainerProps } from './results-container'
import DragElement from 'src/overview/components/DragElement'
import { DeleteConfirmModal } from 'src/overview/delete-confirm-modal'
import SearchTypeSwitch, { SearchTypeSwitchProps } from './search-type-switch'
import PageInfo from './page-info'
import cx from 'classnames'
import { Annotation } from 'src/annotations/types'
import LoadingIndicator from 'src/common-ui/components/LoadingIndicator'
import { features } from 'src/util/remote-functions-background'

const styles = require('./sidebar.css')

interface OwnProps {
    env: 'inpage' | 'overview'
    isOpen: boolean
    isLoading: boolean
    needsWaypoint?: boolean
    appendLoader: boolean
    annotations: Annotation[]
    activeAnnotationUrl: string
    hoverAnnotationUrl: string
    showCommentBox: boolean
    searchValue: string
    showCongratsMessage: boolean
    page: Page
    pageType: 'page' | 'all'
    showFiltersSidebar: boolean
    showSocialSearch: boolean

    closeSidebar: () => void

    handleAddPageCommentBtnClick: () => void

    annotationModes: { [annotationUrl: string]: 'default' | 'edit' | 'delete' }
    annotationProps: {
        handleGoToAnnotation: (annotation: Annotation) => void
        handleAnnotationBoxMouseEnter: (annotation: Annotation) => void
        handleAnnotationBoxMouseLeave: () => void
        handleAnnotationModeSwitch: (event: {
            annotationUrl: string
            mode: 'default' | 'edit' | 'delete'
        }) => void
        handleAnnotationTagClick: (event: {
            annotationUrl: string
            tag: string
        }) => void
        handleEditAnnotation: (
            url: string,
            comment: string,
            tags: string[],
        ) => void
        handleDeleteAnnotation: (url: string) => void
    }
    handleScrollPagination: (args: Waypoint.CallbackArgs) => void
    handleAnnotationBookmarkToggle: (url: string) => void
    onQueryKeyDown: (searchValue: string) => void
    onQueryChange: (searchValue: string) => void
    onShowFiltersSidebarChange: (value: boolean) => void
    onOpenSettings: () => void
    clearAllFilters: () => void
    resetPage: () => void

    commentBox: CommentBoxProps
    resultsContainer: ResultsContainerProps
    searchTypeSwitch: SearchTypeSwitchProps
    filtersSidebar: FiltersSidebarProps
    topBar: TopbarState
}

type Props = OwnProps

export default class Sidebar extends React.Component<Props> {
    async componentDidMount() {
        this.setState({
            showSocialSearch: await features.getFeature('SocialIntegration'),
        })
    }

    private handleSearchChange = (searchQuery: string) => {
        if (this.props.searchValue !== searchQuery) {
            this.props.onQueryChange(searchQuery)
        }
    }

    private handleSearchEnter = (
        e: React.SyntheticEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => this.props.onQueryKeyDown(this.props.searchValue)

    private handleClearBtn = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault()
        e.stopPropagation()

        this.props.onQueryChange('')
    }

    private handleCloseBtnClick = () => {
        this.props.closeSidebar()
        this.props.onShowFiltersSidebarChange(false)
    }

    private handleClearFiltersBtnClick = (
        e: React.MouseEvent<HTMLSpanElement>,
    ) => {
        e.preventDefault()
        e.stopPropagation()
        this.props.onShowFiltersSidebarChange(false)

        this.props.onQueryChange('')
        this.props.clearAllFilters()
    }

    get isCurrentPageSearch(): boolean {
        return this.props.pageType === 'page'
    }

    handleGoToAnnotation = (annot: Annotation) => (
        event: React.MouseEvent<HTMLElement>,
    ) => {
        event.preventDefault()
        this.props.annotationProps.handleGoToAnnotation(annot)
    }

    private renderAnnots() {
        const { annotationProps } = this.props
        const annots = this.props.annotations.map((annot, i) => (
            <AnnotationBox
                key={i}
                env={this.props.env}
                highlighter={null}
                mode={this.props.annotationModes[annot.url] || 'default'}
                displayCrowdfunding={false}
                {...annot}
                {...this.props.annotationProps}
                isActive={this.props.activeAnnotationUrl === annot.url}
                isHovered={this.props.hoverAnnotationUrl === annot.url}
                handleGoToAnnotation={this.handleGoToAnnotation(annot)}
                handleAnnotationTagClick={tag =>
                    annotationProps.handleAnnotationTagClick({
                        annotationUrl: annot.url,
                        tag,
                    })
                }
                handleMouseLeave={event => {
                    event.preventDefault()
                    annotationProps.handleAnnotationBoxMouseLeave()
                }}
                handleMouseEnter={event => {
                    event.preventDefault()
                    annotationProps.handleAnnotationBoxMouseEnter(annot)
                }}
                handleBookmarkToggle={this.props.handleAnnotationBookmarkToggle}
            />
        ))

        if (this.props.needsWaypoint) {
            annots.push(
                <Waypoint
                    onEnter={this.props.handleScrollPagination}
                    key="sidebar-waypoint"
                />,
            )
        }

        if (this.props.isLoading && this.props.appendLoader) {
            annots.push(<LoadingIndicator key="spinner" />)
        }

        return annots
    }

    private renderResults() {
        return (
            <React.Fragment>
                <ResultsContainer {...this.props.resultsContainer} />
                <DeleteConfirmModal message="Delete page and related notes" />
                <DragElement />
            </React.Fragment>
        )
    }

    render() {
        const {
            env,
            isOpen,
            annotations,
            showCommentBox,
            showCongratsMessage,
            handleAddPageCommentBtnClick: handleAddCommentBtnClick,
        } = this.props

        return (
            <React.Fragment>
                <Menu
                    isOpen={isOpen}
                    width={450}
                    styles={menuStyles(env, isOpen)}
                    right
                    noOverlay
                    disableCloseOnEsc
                >
                    <div className={styles.sidebar}>
                        <div className={styles.topSection}>
                            <Topbar
                                {...this.props.topBar}
                                handleCloseBtnClick={this.handleCloseBtnClick}
                                handleSettingsBtnClick={
                                    this.props.onOpenSettings
                                }
                                handleAddCommentBtnClick={
                                    handleAddCommentBtnClick
                                }
                                handleSearchChange={this.handleSearchChange}
                                handleSearchEnter={this.handleSearchEnter}
                                handleClearBtn={this.handleClearBtn}
                                handleFilterBtnClick={
                                    this.props.filtersSidebar.toggleShowFilters
                                }
                                handleClearFiltersBtnClick={
                                    this.handleClearFiltersBtnClick
                                }
                            />
                            {env === 'inpage' && (
                                <React.Fragment>
                                    <div className={styles.searchSwitch}>
                                        <SearchTypeSwitch
                                            {...this.props.searchTypeSwitch}
                                            isOverview={
                                                this.props.env === 'overview'
                                            }
                                            handleAddPageCommentBtnClick={
                                                handleAddCommentBtnClick
                                            }
                                            showSocialSearch={
                                                this.props.showSocialSearch
                                            }
                                        />
                                    </div>
                                    <PageInfo
                                        page={this.props.page}
                                        isCurrentPage={this.isCurrentPageSearch}
                                        resetPage={this.props.resetPage}
                                    />
                                </React.Fragment>
                            )}
                        </div>
                        <div>
                            {showCommentBox && (
                                <div className={styles.commentBoxContainer}>
                                    <CommentBoxContainer
                                        {...this.props.commentBox}
                                    />
                                </div>
                            )}
                        </div>
                        <div
                            className={cx(styles.resultsContainer, {
                                [styles.resultsContainerPage]:
                                    env === 'overview',
                            })}
                        >
                            {!this.isCurrentPageSearch ? (
                                this.renderResults()
                            ) : this.props.isLoading &&
                              !this.props.appendLoader ? (
                                <LoadingIndicator />
                            ) : annotations.length === 0 ? (
                                <EmptyMessage />
                            ) : (
                                <div className={styles.annotationsSection}>
                                    {this.renderAnnots()}
                                    {showCongratsMessage && <CongratsMessage />}
                                </div>
                            )}
                        </div>
                    </div>
                </Menu>
                {this.props.showFiltersSidebar && (
                    <FiltersSidebar {...this.props.filtersSidebar} />
                )}
            </React.Fragment>
        )
    }
}
