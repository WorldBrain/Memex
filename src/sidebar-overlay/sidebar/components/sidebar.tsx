import * as React from 'react'
import Waypoint from 'react-waypoint'
import Menu from 'react-burger-menu/lib/menus/slide'

import { CongratsMessage, Topbar, Loader, EmptyMessage } from '../../components'
import AnnotationBox from 'src/sidebar-overlay/annotation-box'
import menuStyles from './menu-styles'
import CommentBoxContainer from '../../comment-box'
import { Annotation } from '../types'
import { openSettings } from '../../utils'
import SearchBox from '../../components/search-box'
import FiltersSidebar from './filters-sidebar-container'
import ResultsContainer from './results-container'
import DragElement from 'src/overview/components/DragElement'
import { DeleteConfirmModal } from 'src/overview/delete-confirm-modal'
import SearchTypeSwitch from './search-type-switch'
import cx from 'classnames'

const styles = require('./sidebar.css')

interface Props {
    env: 'inpage' | 'overview'
    isOpen: boolean
    isLoading: boolean
    needsWaypoint?: boolean
    appendLoader: boolean
    annotations: Annotation[]
    activeAnnotationUrl: string
    hoverAnnotationUrl: string
    showCommentBox: boolean
    showCongratsMessage: boolean
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
            this.props.onQueryKeyDown(this.state.searchValue)
        }
    }

    private handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault()
        e.stopPropagation()

        const searchValue = e.target.value
        this.setState({ searchValue })
        this.props.onQueryChange(this.state.searchValue)
    }

    private handleClearBtn = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault()
        e.stopPropagation()
        this.setState({ searchValue: '' })
        this.props.onQueryChange(this.state.searchValue)
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
                        disableAddCommentBtn={showCommentBox}
                        handleCloseBtnClick={this.handleCloseBtnClick}
                        handleSettingsBtnClick={this._handleSettingsBtnClick}
                        handleAddCommentBtnClick={handleAddCommentBtnClick}
                    />
                    <div className={styles.sidebar}>
                        <SearchBox
                            placeholder={'Search Memex (confirm with ENTER)'}
                            searchValue={this.state.searchValue}
                            onSearchChange={this.handleChange}
                            onSearchEnter={this.handleSearchKeyDown}
                            onClearBtn={this.handleClearBtn}
                        />
                        <div className={styles.navBar}>
                            <a
                                className={cx(
                                    styles.filterNav,
                                    styles.navLinks,
                                )}
                                onClick={this.toggleShowFilters}
                            >
                                Filters
                            </a>
                        </div>
                        <SearchTypeSwitch />

                        {showCommentBox && (
                            <div className={styles.commentBoxContainer}>
                                <CommentBoxContainer env={env} />
                            </div>
                        )}
                        {this.isPageSearch || !this.isCurrentPageSearch ? (
                            this.renderResults()
                        ) : this.props.isLoading && !this.props.appendLoader ? (
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
                </Menu>
                {this.state.showFiltersSidebar && (
                    <FiltersSidebar
                        env={this.props.env}
                        toggleShowFilters={this.toggleShowFilters}
                    />
                )}
            </React.Fragment>
        )
    }
}

export default Sidebar
