import * as React from 'react'
import Waypoint from 'react-waypoint'
import Menu from 'react-burger-menu/lib/menus/slide'
import cx from 'classnames'

import { CongratsMessage, Topbar, Loader, EmptyMessage } from '../../components'
import AnnotationBox from 'src/sidebar-overlay/annotation-box'
import menuStyles from './menu-styles'
import CommentBoxContainer from '../../comment-box'
import { Annotation, Page } from '../types'
import { openSettings } from '../../utils'
import FiltersSidebarContainer from './filters-sidebar-container'
import ResultsContainer from './results-container'
import DragElement from 'src/overview/components/DragElement'
import { DeleteConfirmModal } from 'src/overview/delete-confirm-modal'
import SearchTypeSwitch from './search-type-switch'
import PageInfo from './page-info'
import { isPdfViewer } from 'src/pdf-viewer/util'
import { remoteFunction } from 'src/util/webextensionRPC'

const styles = require('./sidebar.css')

interface Props extends Page {
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
    showClearFiltersBtn: boolean
    pageType: 'page' | 'all'
    searchType: 'notes' | 'pages'
    closeSidebar: () => void
    handleGoToAnnotation: (
        annotation: Annotation,
    ) => (e: React.MouseEvent<HTMLElement>) => void
    handleAddCommentBtnClick: () => void
    handleAnnotationBoxMouseEnter: (
        annotation: Annotation,
    ) => (e: Event) => void
    handleAnnotationBoxMouseLeave: () => (e: Event) => void
    handleEditAnnotation: (url: string, comment: string, tags: string[]) => void
    handleDeleteAnnotation: (url: string) => void
    handleScrollPagination: (args: Waypoint.CallbackArgs) => void
    handleBookmarkToggle: (url: string) => void
    onQueryKeyDown: (searchValue: string) => void
    onQueryChange: (searchValue: string) => void
    handleSearchTypeClick: React.MouseEventHandler<HTMLButtonElement>
    clearAllFilters: () => void
    resetPage: React.MouseEventHandler<HTMLButtonElement>
}

interface State {
    searchValue: string
    showFiltersSidebar: boolean
}

class Sidebar extends React.Component<Props, State> {
    private _handleSettingsBtnClick = openSettings

    state = {
        searchValue: '',
        showFiltersSidebar: false,
    }

    private handleSearchKeyDown = (
        e: React.KeyboardEvent<HTMLInputElement>,
    ) => {
        if (
            this.props.env === 'inpage' &&
            !(e.ctrlKey || e.metaKey) &&
            /[a-zA-Z0-9-_ ]/.test(String.fromCharCode(e.keyCode))
        ) {
            e.preventDefault()
            e.stopPropagation()
            this.setState(state => ({ searchValue: state.searchValue + e.key }))
            this.props.onQueryChange(this.state.searchValue)
            return
        }

        if (e.key === 'Enter') {
            e.preventDefault()
            e.stopPropagation()
            this.props.onQueryKeyDown(this.state.searchValue)
        }
    }

    private handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (this.state.searchValue !== e.target.value) {
            this.props.onQueryChange(e.target.value)
        }
        this.setState({ searchValue: e.target.value })
    }

    private handleClearBtn = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault()
        e.stopPropagation()

        this.setState({ searchValue: '' })
        this.props.onQueryChange('')
    }

    private toggleShowFilters = () => {
        this.setState(prevState => ({
            showFiltersSidebar: !prevState.showFiltersSidebar,
        }))
    }

    private handleCloseBtnClick = () => {
        this.props.closeSidebar()
        this.setState({ showFiltersSidebar: false })
    }

    private handleClearFiltersBtnClick = (
        e: React.MouseEvent<HTMLSpanElement>,
    ) => {
        e.preventDefault()
        e.stopPropagation()
        this.setState(state => ({
            showFiltersSidebar: false,
            searchValue: '',
        }))
        this.props.clearAllFilters()
    }

    get isPageSearch() {
        return this.props.searchType === 'pages'
    }

    get isCurrentPageSearch() {
        return this.props.pageType === 'page'
    }

    private renderAnnots() {
        const annots = this.props.annotations.map(annot => (
            <AnnotationBox
                key={annot.url}
                env={this.props.env}
                {...annot}
                isActive={this.props.activeAnnotationUrl === annot.url}
                isHovered={this.props.hoverAnnotationUrl === annot.url}
                handleGoToAnnotation={this.props.handleGoToAnnotation(annot)}
                handleEditAnnotation={this.props.handleEditAnnotation}
                handleDeleteAnnotation={this.props.handleDeleteAnnotation}
                handleMouseLeave={this.props.handleAnnotationBoxMouseLeave()}
                handleMouseEnter={this.props.handleAnnotationBoxMouseEnter(
                    annot,
                )}
                handleBookmarkToggle={this.props.handleBookmarkToggle}
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
            annots.push(<Loader key="more-loading" />)
        }

        return annots
    }

    private renderResults() {
        return (
            <React.Fragment>
                <ResultsContainer />
                <DeleteConfirmModal message="Delete page and related note" />
                <DragElement />
            </React.Fragment>
        )
    }

    render() {
        const {
            env,
            isOpen,
            isLoading,
            annotations,
            showCommentBox,
            showCongratsMessage,
            handleAddCommentBtnClick,
        } = this.props

        return (
            <React.Fragment>
                <Menu
                    isOpen={isOpen}
                    width={340}
                    styles={menuStyles(env)}
                    right
                    noOverlay
                    disableCloseOnEsc
                >
                    <Topbar
                        {...this.props}
                        disableAddCommentBtn={showCommentBox}
                        handleCloseBtnClick={this.handleCloseBtnClick}
                        handleSettingsBtnClick={this._handleSettingsBtnClick}
                        handleAddCommentBtnClick={handleAddCommentBtnClick}
                        handleChange={this.handleChange}
                        handleSearchKeyDown={this.handleSearchKeyDown}
                        handleClearBtn={this.handleClearBtn}
                        handleFilterBtnClick={this.toggleShowFilters}
                        handleClearFiltersBtnClick={
                            this.handleClearFiltersBtnClick
                        }
                    />
                    <div className={styles.sidebar}>
                        {env === 'inpage' && (
                            <React.Fragment>
                                <div className={styles.searchSwitch}>
                                    <SearchTypeSwitch />
                                </div>
                                <PageInfo
                                    url={this.props.url}
                                    title={this.props.title}
                                    isCurrentPage={this.isCurrentPageSearch}
                                    resetPage={this.props.resetPage}
                                />
                            </React.Fragment>
                        )}
                        {showCommentBox && (
                            <div className={styles.commentBoxContainer}>
                                <CommentBoxContainer env={env} />
                            </div>
                        )}
                        {!isPdfViewer() &&
                            window.location.href.endsWith('.pdf') && (
                                <button
                                    className={cx(styles.annotatePDFButton)}
                                    onClick={e => {
                                        e.preventDefault()
                                        remoteFunction('openPdfViewer')()
                                    }}
                                >
                                    Annotate PDF
                                </button>
                            )}
                        <div
                            className={cx(styles.resultsContainer, {
                                [styles.resultsContainerPage]:
                                    env === 'overview',
                            })}
                        >
                            {this.isPageSearch || !this.isCurrentPageSearch ? (
                                this.renderResults()
                            ) : this.props.isLoading &&
                            !this.props.appendLoader ? (
                                <Loader />
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
                {this.state.showFiltersSidebar && (
                    <FiltersSidebarContainer
                        env={this.props.env}
                        toggleShowFilters={this.toggleShowFilters}
                    />
                )}
            </React.Fragment>
        )
    }
}

export default Sidebar
