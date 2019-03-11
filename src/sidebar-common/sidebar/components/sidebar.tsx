import * as React from 'react'
import Menu from 'react-burger-menu/lib/menus/slide'

import { CongratsMessage, Topbar, Loader, EmptyMessage } from '../../components'
import AnnotationBoxContainer from '../../annotation-box'
import menuStyles from './menu-styles'
import CommentBoxContainer from '../../comment-box'
import { Annotation } from '../types'
import { openSettings } from '../../utils'

import SearchBox from '../../components/search-box'
import cx from 'classnames'

const styles = require('./sidebar.css')

interface Props {
    env: 'inpage' | 'overview'
    isOpen: boolean
    isLoading: boolean
    annotations: Annotation[]
    activeAnnotationUrl: string
    hoverAnnotationUrl: string
    showCommentBox: boolean
    showCongratsMessage: boolean
    closeSidebar: () => void
    handleGoToAnnotation: (
        annotation: Annotation,
    ) => (e: React.MouseEvent<HTMLElement>) => void
    handleAddCommentBtnClick: () => void
    handleMouseEnter: (e: Event) => void
    handleMouseLeave: (e: Event) => void
    handleAnnotationBoxMouseEnter: (
        annotation: Annotation,
    ) => (e: Event) => void
    handleAnnotationBoxMouseLeave: () => (e: Event) => void
}

interface State {
    searchValue: string
    showFilters: boolean
    showPageResults: boolean
    showAllResults: boolean
}

class Sidebar extends React.Component<Props, State> {
    private _sidebarRef: HTMLElement

    constructor(props: Props) {
        super(props)
        this.state = {
            searchValue: '',
            showFilters: false,
            showPageResults: true,
            showAllResults: false,
        }
    }

    componentDidMount() {
        this._attachEventListeners()
    }

    componentWillUnmount() {
        this._removeEventListeners()
    }

    private _attachEventListeners() {
        this._sidebarRef.addEventListener(
            'mouseenter',
            this.props.handleMouseEnter,
        )
        this._sidebarRef.addEventListener(
            'mouseleave',
            this.props.handleMouseLeave,
        )
    }

    private _removeEventListeners() {
        this._sidebarRef.removeEventListener(
            'mouseenter',
            this.props.handleMouseEnter,
        )
        this._sidebarRef.removeEventListener(
            'mouseleave',
            this.props.handleMouseLeave,
        )
    }

    private _setSidebarRef = (ref: HTMLElement) => {
        this._sidebarRef = ref
    }

    private _handleSettingsBtnClick = () => {
        openSettings()
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
        }
    }

    private handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault()
        e.stopPropagation()
        const searchValue = e.target.value
        this.setState({ searchValue })
    }

    render() {
        const {
            env,
            isOpen,
            isLoading,
            annotations,
            activeAnnotationUrl,
            hoverAnnotationUrl,
            showCommentBox,
            showCongratsMessage,
            closeSidebar,
            handleGoToAnnotation,
            handleAddCommentBtnClick,
            handleAnnotationBoxMouseEnter,
            handleAnnotationBoxMouseLeave,
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
                    <div className={styles.sidebar} ref={this._setSidebarRef}>
                        {/*                        <Topbar
                            disableAddCommentBtn={showCommentBox}
                            handleCloseBtnClick={closeSidebar}
                            handleSettingsBtnClick={
                                this._handleSettingsBtnClick
                            }
                            handleAddCommentBtnClick={handleAddCommentBtnClick}
                        />*/}

                        <SearchBox
                            searchValue={this.state.searchValue}
                            onSearchChange={this.handleChange}
                            onSearchEnter={this.handleSearchKeyDown}
                            onClearBtn={() =>
                                this.setState({ searchValue: '' })
                            }
                        />

                        <div className={styles.navBar}>
                            <a
                                className={cx(
                                    styles.filterNav,
                                    styles.navLinks,
                                )}
                                onClick={() =>
                                    this.setState(prevState => ({
                                        showFilters: !prevState.showFilters,
                                    }))
                                }
                            >
                                Filters
                            </a>
                            <span className={styles.resultsNav}>
                                <a
                                    className={styles.navLinks}
                                    onClick={() =>
                                        this.setState({
                                            showPageResults: true,
                                            showAllResults: false,
                                        })
                                    }
                                >
                                    This page
                                </a>
                                <a
                                    className={styles.navLinks}
                                    onClick={() =>
                                        this.setState(prevState => ({
                                            showPageResults: false,
                                            showAllResults: true,
                                        }))
                                    }
                                >
                                    All
                                </a>
                            </span>
                        </div>
                        {showCommentBox && (
                            <div className={styles.commentBoxContainer}>
                                <CommentBoxContainer env={env} />
                            </div>
                        )}
                        {this.state.showPageResults &&
                            (isLoading ? (
                                <Loader />
                            ) : annotations.length === 0 ? (
                                <EmptyMessage />
                            ) : (
                                <div className={styles.annotationsSection}>
                                    {annotations.map(annotation => (
                                        <AnnotationBoxContainer
                                            key={annotation.url}
                                            env={env}
                                            {...annotation}
                                            isActive={
                                                activeAnnotationUrl ===
                                                annotation.url
                                            }
                                            isHovered={
                                                hoverAnnotationUrl ===
                                                annotation.url
                                            }
                                            handleGoToAnnotation={handleGoToAnnotation(
                                                annotation,
                                            )}
                                            handleMouseEnter={handleAnnotationBoxMouseEnter(
                                                annotation,
                                            )}
                                            handleMouseLeave={handleAnnotationBoxMouseLeave()}
                                        />
                                    ))}
                                    {showCongratsMessage && <CongratsMessage />}
                                </div>
                            ))}

                        {this.state.showAllResults && (
                            <div className={styles.allResultsDiv}>
                                All results
                            </div>
                        )}
                    </div>
                </Menu>
                {this.state.showFilters && (
                    <div className={styles.filtersSidebar}>
                        <div className={styles.filtersDiv}>
                            <span>Filters</span>
                            <button
                                className={styles.arrow}
                                onClick={() =>
                                    this.setState({ showFilters: false })
                                }
                                title={'Close filters sidebar'}
                            />
                            <div className={styles.filters}>
                                <button
                                    className={cx(
                                        styles.filterButtons,
                                        styles.bookmark,
                                    )}
                                    onClick={() => {}}
                                />
                                <button
                                    className={styles.filterButtons}
                                    onClick={() => {}}
                                >
                                    Dates
                                </button>
                                <button
                                    className={styles.filterButtons}
                                    onClick={() => {}}
                                >
                                    Tags
                                </button>
                                <button
                                    className={styles.filterButtons}
                                    onClick={() => {}}
                                >
                                    Domains
                                </button>
                                <button
                                    className={styles.filterButtons}
                                    onClick={() => {}}
                                >
                                    Types
                                </button>
                            </div>
                        </div>
                        <div className={styles.listsDiv}>Custom lists</div>
                    </div>
                )}
            </React.Fragment>
        )
    }
}

export default Sidebar
