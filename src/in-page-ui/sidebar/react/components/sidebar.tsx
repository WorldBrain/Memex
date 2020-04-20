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
import DeleteConfirmModal from 'src/overview/delete-confirm-modal/components/DeleteConfirmModal'
import SearchTypeSwitch, { SearchTypeSwitchProps } from './search-type-switch'
import PageInfo from './page-info'
import cx from 'classnames'
import { Annotation } from 'src/annotations/types'
import LoadingIndicator from 'src/common-ui/components/LoadingIndicator'
import { features } from 'src/util/remote-functions-background'
import { HighlightInteractionInterface } from 'src/highlighting/types'
import { TaskState } from 'ui-logic-core/lib/types'
import { AnnotationBoxEventProps } from './annotation-box/annotation-box'
import PageAnnotations, { PageAnnotationsProps } from './page-annotations'

const styles = require('./sidebar.css')

interface OwnProps {
    env: 'inpage' | 'overview'
    isOpen: boolean
    loadState: TaskState
    annotationLoadState: TaskState
    searchLoadState: TaskState

    searchValue: string
    pageType: 'page' | 'all'
    showFiltersSidebar: boolean
    showSocialSearch: boolean

    showCommentBox: boolean
    commentBox: CommentBoxProps

    pageAnnotations: PageAnnotationsProps
    pageInfo: {
        page: Page
        resetPage: () => void
    }

    closeSidebar: () => void

    handleAddPageCommentBtnClick: () => void

    pageDeleteDialog: {
        isDeletePageModelShown: boolean
        handleDeletePages: () => Promise<void>
        handleDeletePagesModalClose: () => void
    }

    highlighter: Pick<HighlightInteractionInterface, 'removeTempHighlights'>
    onQueryKeyDown: (searchValue: string) => void
    onQueryChange: (searchValue: string) => void
    onShowFiltersSidebarChange: (value: boolean) => void
    onOpenSettings: () => void
    clearAllFilters: () => void

    resultsContainer: ResultsContainerProps
    searchTypeSwitch: SearchTypeSwitchProps
    filtersSidebar: FiltersSidebarProps
    topBar: TopbarState
}

type Props = OwnProps

export default class Sidebar extends React.Component<Props> {
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

    handleGoToAnnotation = (annot: Annotation) => (
        event: React.MouseEvent<HTMLElement>,
    ) => {
        event.preventDefault()
        this.props.pageAnnotations.annotationEventHandlers.handleGoToAnnotation(
            annot.url,
        )
    }

    private renderResults() {
        return (
            <React.Fragment>
                <ResultsContainer {...this.props.resultsContainer} />
                <DeleteConfirmModal
                    deleteDocs={this.props.pageDeleteDialog.handleDeletePages}
                    isShown={this.props.pageDeleteDialog.isDeletePageModelShown}
                    onClose={
                        this.props.pageDeleteDialog.handleDeletePagesModalClose
                    }
                    message="Delete page and related notes"
                />
                <DragElement />
            </React.Fragment>
        )
    }

    renderAnnotsOrResults() {
        if (
            this.props.searchTypeSwitch.searchType !== 'page' ||
            this.props.searchTypeSwitch.pageType !== 'page'
        ) {
            return this.renderResults()
        }
        if (this.props.annotationLoadState !== 'success') {
            return <LoadingIndicator />
        }

        return (
            <div className={styles.annotationsSection}>
                <PageAnnotations {...this.props.pageAnnotations} />
            </div>
        )
    }

    renderTopBar() {
        const {
            handleAddPageCommentBtnClick: handleAddCommentBtnClick,
        } = this.props

        return (
            <Topbar
                {...this.props.topBar}
                handleCloseBtnClick={this.handleCloseBtnClick}
                handleSettingsBtnClick={this.props.onOpenSettings}
                handleAddCommentBtnClick={handleAddCommentBtnClick}
                handleSearchChange={this.handleSearchChange}
                handleSearchEnter={this.handleSearchEnter}
                handleClearBtn={this.handleClearBtn}
                handleFilterBtnClick={
                    this.props.filtersSidebar.toggleShowFilters
                }
                handleClearFiltersBtnClick={this.handleClearFiltersBtnClick}
            />
        )
    }

    renderSearchTypeSwitch() {
        const {
            handleAddPageCommentBtnClick: handleAddCommentBtnClick,
        } = this.props

        return (
            <div className={styles.searchSwitch}>
                <SearchTypeSwitch
                    {...this.props.searchTypeSwitch}
                    isOverview={this.props.env === 'overview'}
                    handleAddPageCommentBtnClick={handleAddCommentBtnClick}
                />
            </div>
        )
    }

    renderPageInfo() {
        return (
            <PageInfo
                page={this.props.pageInfo.page}
                isCurrentPage={this.props.pageType === 'page'}
                resetPage={this.props.pageInfo.resetPage}
            />
        )
    }

    render() {
        const { env, isOpen, showCommentBox } = this.props

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
                            {this.renderTopBar()}
                            {env === 'inpage' && (
                                <React.Fragment>
                                    {this.renderSearchTypeSwitch()}
                                    {this.renderPageInfo()}
                                </React.Fragment>
                            )}
                        </div>
                        <div>{showCommentBox && this.renderCommentBox()}</div>
                        <div
                            className={cx(styles.resultsContainer, {
                                [styles.resultsContainerPage]:
                                    env === 'overview',
                            })}
                        >
                            {this.renderAnnotsOrResults()}
                        </div>
                    </div>
                </Menu>
                {this.props.showFiltersSidebar && (
                    <FiltersSidebar {...this.props.filtersSidebar} />
                )}
            </React.Fragment>
        )
    }

    private renderCommentBox(): React.ReactNode {
        return (
            <div className={styles.commentBoxContainer}>
                <CommentBoxContainer {...this.props.commentBox} />
            </div>
        )
    }
}
