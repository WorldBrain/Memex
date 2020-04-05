import * as React from 'react'
import Waypoint from 'react-waypoint'
import Menu from 'react-burger-menu/lib/menus/slide'

import { CongratsMessage, Topbar, EmptyMessage } from '../../components'
import AnnotationBox from 'src/sidebar-overlay/annotation-box'
import menuStyles from './menu-styles'
import CommentBoxContainer from '../../comment-box'
import { Page } from '../types'
import { openSettings } from '../../utils'
import FiltersSidebarContainer from './filters-sidebar-container'
import ResultsContainer from './results-container'
import DragElement from 'src/overview/components/DragElement'
import { DeleteConfirmModal } from 'src/overview/delete-confirm-modal'
import SearchTypeSwitch from './search-type-switch'
import PageInfo from './page-info'
import cx from 'classnames'
import { Annotation } from 'src/annotations/types'
import LoadingIndicator from 'src/common-ui/components/LoadingIndicator'
import { features } from 'src/util/remote-functions-background'

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
    searchValue: string
    showCongratsMessage: boolean
    showClearFiltersBtn: boolean
    isSocialPost: boolean
    page: Page
    pageType: 'page' | 'all'
    searchType: 'notes' | 'page' | 'social'
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
    clearAllFilters: () => void
    resetPage: React.MouseEventHandler<HTMLDivElement>
}

interface State {
    searchValue: string
    showFiltersSidebar: boolean
    showSocialSearch: boolean
}

class Sidebar extends React.Component<Props, State> {
    private _handleSettingsBtnClick = openSettings

    state = {
        searchValue: '',
        showFiltersSidebar: false,
        showSocialSearch: false,
    }

    async componentDidMount() {
        this.setState({
            showSocialSearch: await features.getFeature('SocialIntegration'),
        })
    }

    private handleSearchChange = (searchQuery: string) => {
        if (this.state.searchValue !== searchQuery) {
            this.setState({ searchValue: searchQuery })
            this.props.onQueryChange(searchQuery)
        }
        this.setState({ searchValue: searchQuery })
    }

    private handleSearchEnter = (
        e: React.SyntheticEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => this.props.onQueryKeyDown(this.state.searchValue)

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

    get isCurrentPageSearch(): boolean {
        return this.props.pageType === 'page'
    }

    handleDeleteAnnotation = url => {
        this.props.handleDeleteAnnotation(url)
    }

    private renderAnnots() {
        const annots = this.props.annotations.map((annot, i) => (
            <AnnotationBox
                key={i}
                env={this.props.env}
                {...annot}
                isActive={this.props.activeAnnotationUrl === annot.url}
                isHovered={this.props.hoverAnnotationUrl === annot.url}
                handleGoToAnnotation={this.props.handleGoToAnnotation(annot)}
                handleEditAnnotation={this.props.handleEditAnnotation}
                handleDeleteAnnotation={this.handleDeleteAnnotation}
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
            annots.push(<LoadingIndicator key="spinner" />)
        }

        return annots
    }

    private renderResults() {
        return (
            <React.Fragment>
                <ResultsContainer />
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
            handleAddCommentBtnClick,
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
                                {...this.props}
                                disableAddCommentBtn={showCommentBox}
                                handleCloseBtnClick={this.handleCloseBtnClick}
                                handleSettingsBtnClick={
                                    this._handleSettingsBtnClick
                                }
                                handleAddCommentBtnClick={
                                    handleAddCommentBtnClick
                                }
                                handleSearchChange={this.handleSearchChange}
                                handleSearchEnter={this.handleSearchEnter}
                                handleClearBtn={this.handleClearBtn}
                                handleFilterBtnClick={this.toggleShowFilters}
                                handleClearFiltersBtnClick={
                                    this.handleClearFiltersBtnClick
                                }
                            />
                            {env === 'inpage' && (
                                <React.Fragment>
                                    <div className={styles.searchSwitch}>
                                        <SearchTypeSwitch
                                            isOverview={
                                                this.props.env === 'overview'
                                            }
                                            handleAddCommentBtnClick={
                                                handleAddCommentBtnClick
                                            }
                                            showSocialSearch={
                                                this.state.showSocialSearch
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
                                        env={env}
                                        isSocialPost={this.props.isSocialPost}
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
