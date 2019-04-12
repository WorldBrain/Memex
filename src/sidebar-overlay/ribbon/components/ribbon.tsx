import React, {
    Component,
    ReactNode,
    KeyboardEventHandler,
    SyntheticEvent,
} from 'react'
import cx from 'classnames'

import qs from 'query-string'
import { remoteFunction } from 'src/util/webextensionRPC'
import extractQueryFilters from 'src/util/nlp-time-filter'
import CommentBoxContainer from 'src/sidebar-common/comment-box'
import { Tooltip, ButtonTooltip } from 'src/common-ui/components/'
import {
    highlightAnnotations,
    removeHighlights,
} from '../../content_script/highlight-interactions'

const styles = require('./ribbon.css')

interface Props {
    initShowCommentBox?: boolean
    initShowSearchBox?: boolean
    initShowTagsPicker?: boolean
    initShowCollsPicker?: boolean
    isExpanded: boolean
    isRibbonEnabled: boolean
    isTooltipEnabled: boolean
    isSidebarOpen: boolean
    isPaused: boolean
    isBookmarked: boolean
    tagManager: ReactNode
    collectionsManager: ReactNode
    openSidebar: (args: any) => void
    closeSidebar: () => void
    handleRibbonToggle: () => void
    handleTooltipToggle: () => void
    handleRemoveRibbon: () => void
    handleBookmarkToggle: () => void
    handlePauseToggle: () => void
    isCommentSaved: boolean
    commentText: string
    setShowCommentBox: () => void
}

interface State {
    showCommentBox: boolean
    showSearchBox: boolean
    showTagsPicker: boolean
    showCollectionsPicker: boolean
    showHighlights?: boolean
    searchValue: string
}

const defaultState: State = {
    showCommentBox: false,
    showSearchBox: false,
    showTagsPicker: false,
    showCollectionsPicker: false,
    searchValue: '',
}

class Ribbon extends Component<Props, State> {
    static defaultProps = {
        initShowCollsPicker: defaultState.showCollectionsPicker,
        initShowTagsPicker: defaultState.showTagsPicker,
        initShowCommentBox: defaultState.showCommentBox,
        initShowSearchBox: defaultState.showSearchBox,
    }

    private openOverviewTabRPC
    private openOptionsTabRPC
    private ribbonRef: HTMLElement

    private inputQueryEl: HTMLInputElement

    private setInputRef = (el: HTMLInputElement) => (this.inputQueryEl = el)

    constructor(props: Props) {
        super(props)
        this.openOverviewTabRPC = remoteFunction('openOverviewTab')
        this.openOptionsTabRPC = remoteFunction('openOptionsTab')

        this.state = {
            ...defaultState,
            showCommentBox: props.initShowCommentBox,
            showSearchBox: props.initShowSearchBox,
            showTagsPicker: props.initShowTagsPicker,
            showCollectionsPicker: props.initShowCollsPicker,
        }
    }

    componentDidMount() {
        this.ribbonRef.addEventListener('mouseleave', this.handleMouseLeave)
    }

    componentWillUnmount() {
        this.ribbonRef.removeEventListener('mouseleave', this.handleMouseLeave)
    }

    private handleMouseLeave = () => {
        this.props.commentText.length > 0
            ? this.setState({
                  ...defaultState,
                  showCommentBox: true,
              })
            : this.setState(defaultState)
    }

    private handleSearchEnterPress: KeyboardEventHandler<
        HTMLInputElement
    > = event => {
        event.preventDefault()
        const queryFilters = extractQueryFilters(this.state.searchValue)
        const queryParams = qs.stringify(queryFilters)

        this.openOverviewTabRPC(queryParams)
    }

    private handleCommentIconBtnClick = () => {
        if (this.props.isSidebarOpen) {
            this.props.setShowCommentBox()
            return
        }
        this.setState(prevState => ({
            ...defaultState,
            showCommentBox: !prevState.showCommentBox,
        }))
    }

    private toggleHighlights = () => {
        this.state.showHighlights
            ? removeHighlights()
            : this.fetchAndHighlightAnnotations()
        this.setState(prevState => ({
            showHighlights: !prevState.showHighlights,
        }))
    }

    private fetchAndHighlightAnnotations = async () => {
        const annotations = await remoteFunction('getAllAnnotationsByUrl')({
            url: window.location.href,
        })
        const highlights = annotations.filter(annotation => annotation.selector)
        highlightAnnotations(highlights, this.props.openSidebar)
    }

    private handleSearchKeyDown = (
        event: React.KeyboardEvent<HTMLInputElement>,
    ) => {
        if (
            !(event.ctrlKey || event.metaKey) &&
            /[a-zA-Z0-9-_ ]/.test(String.fromCharCode(event.keyCode))
        ) {
            event.preventDefault()
            event.stopPropagation()
            this.setState(state => ({
                ...state,
                searchValue: state.searchValue + event.key,
            }))
            return
        }

        switch (event.key) {
            case 'Enter':
                return this.handleSearchEnterPress(event)
            default:
        }
    }

    private handleSearchChange = (
        event: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const searchValue = event.target.value

        this.setState(state => ({ ...state, searchValue }))
    }

    render() {
        return (
            <div
                ref={ref => (this.ribbonRef = ref)}
                className={cx(styles.ribbon, {
                    [styles.ribbonExpanded]:
                        this.props.isExpanded || this.props.isSidebarOpen,
                })}
            >
                {(this.props.isExpanded || this.props.isSidebarOpen) && (
                    <React.Fragment>
                        <div className={styles.generalActions}>
                            <ButtonTooltip
                                tooltipText="Open Dashboard"
                                position="left"
                            >
                                <button
                                    onClick={() => this.openOverviewTabRPC()}
                                    className={cx(styles.button, styles.logo)}
                                />
                            </ButtonTooltip>

                            <ButtonTooltip
                                tooltipText={
                                    !this.props.isSidebarOpen
                                        ? 'Open Sidebar (R)'
                                        : 'Close Sidebar (ESC)'
                                }
                                position="left"
                            >
                                <button
                                    className={cx(styles.button, {
                                        [styles.arrow]: !this.props
                                            .isSidebarOpen,
                                        [styles.arrowReverse]: this.props
                                            .isSidebarOpen,
                                    })}
                                    onClick={() =>
                                        !this.props.isSidebarOpen
                                            ? this.props.openSidebar({})
                                            : this.props.closeSidebar()
                                    }
                                />
                            </ButtonTooltip>

                            <div>
                                <ButtonTooltip
                                    tooltipText={'Search Memex via Dashboard'}
                                    position="left"
                                >
                                    <button
                                        className={cx(
                                            styles.button,
                                            styles.search,
                                        )}
                                        onClick={() => {
                                            this.setState(prevState => ({
                                                ...defaultState,
                                                showSearchBox: !prevState.showSearchBox,
                                            }))
                                            this.inputQueryEl.focus()
                                        }}
                                    />
                                    {this.state.showSearchBox && (
                                        <Tooltip
                                            position="left"
                                            itemClass={styles.tooltipLeft}
                                            toolTipType="searchBar"
                                        >
                                            <form>
                                                <span
                                                    className={styles.search}
                                                />
                                                <input
                                                    autoFocus={false}
                                                    ref={this.setInputRef}
                                                    className={
                                                        styles.searchInput
                                                    }
                                                    name="query"
                                                    placeholder="Search your Memex"
                                                    autoComplete="off"
                                                    onKeyDown={
                                                        this.handleSearchKeyDown
                                                    }
                                                    onChange={
                                                        this.handleSearchChange
                                                    }
                                                    value={
                                                        this.state.searchValue
                                                    }
                                                />
                                            </form>
                                        </Tooltip>
                                    )}
                                </ButtonTooltip>
                            </div>
                        </div>
                        <div className={styles.pageActions}>
                            <ButtonTooltip
                                tooltipText={
                                    !this.props.isBookmarked
                                        ? 'Star page'
                                        : 'Un-Star page'
                                }
                                position="left"
                            >
                                <button
                                    className={cx(styles.button, {
                                        [styles.bookmark]: this.props
                                            .isBookmarked,
                                        [styles.notBookmark]: !this.props
                                            .isBookmarked,
                                    })}
                                    onClick={() =>
                                        this.props.handleBookmarkToggle()
                                    }
                                />
                            </ButtonTooltip>
                            <div>
                                <ButtonTooltip
                                    tooltipText="Add notes to page"
                                    position="left"
                                >
                                    <button
                                        className={cx(
                                            styles.button,
                                            styles.comments,
                                        )}
                                        onClick={this.handleCommentIconBtnClick}
                                    />
                                    {this.state.showCommentBox && (
                                        <Tooltip position="left">
                                            <CommentBoxContainer env="inpage" />
                                        </Tooltip>
                                    )}
                                    {this.props.isCommentSaved && (
                                        <Tooltip
                                            position="left"
                                            itemClass={styles.commentSaved}
                                        >
                                            <div className={styles.saveBox}>
                                                <span
                                                    className={styles.saveIcon}
                                                />
                                                <span
                                                    className={styles.saveText}
                                                >
                                                    Saved!
                                                </span>
                                            </div>
                                        </Tooltip>
                                    )}
                                </ButtonTooltip>
                            </div>

                            <div>
                                <ButtonTooltip
                                    tooltipText="Add tags to page"
                                    position="left"
                                >
                                    <button
                                        className={cx(
                                            styles.button,
                                            styles.tag,
                                        )}
                                        onClick={() =>
                                            this.setState(prevState => ({
                                                ...defaultState,
                                                showTagsPicker: !prevState.showTagsPicker,
                                            }))
                                        }
                                    />
                                    {this.state.showTagsPicker && (
                                        <Tooltip position="left">
                                            {this.props.tagManager}
                                        </Tooltip>
                                    )}
                                </ButtonTooltip>
                            </div>

                            <div>
                                <ButtonTooltip
                                    tooltipText="Add page to collections"
                                    position="left"
                                >
                                    <button
                                        className={cx(
                                            styles.button,
                                            styles.collection,
                                        )}
                                        onClick={() =>
                                            this.setState(prevState => ({
                                                ...defaultState,
                                                showCollectionsPicker: !prevState.showCollectionsPicker,
                                            }))
                                        }
                                    />
                                    {this.state.showCollectionsPicker && (
                                        <Tooltip
                                            position="left"
                                            itemClass={styles.collectionDiv}
                                        >
                                            {this.props.collectionsManager}
                                        </Tooltip>
                                    )}
                                </ButtonTooltip>
                            </div>
                        </div>
                        <div className={styles.settingsActions}>
                            <ButtonTooltip
                                tooltipText={
                                    'Remove Toolbar once. Disable permanently with button below.'
                                }
                                position="left"
                            >
                                <button
                                    className={cx(styles.button, styles.cancel)}
                                    onClick={() =>
                                        this.props.handleRemoveRibbon()
                                    }
                                />
                            </ButtonTooltip>

                            <ButtonTooltip
                                tooltipText="Disable this Toolbar"
                                position="left"
                            >
                                <button
                                    className={cx(
                                        styles.button,
                                        styles.ribbonIcon,
                                        {
                                            [styles.ribbonOn]: this.props
                                                .isRibbonEnabled,
                                            [styles.ribbonOff]: !this.props
                                                .isRibbonEnabled,
                                        },
                                    )}
                                    onClick={() =>
                                        this.props.handleRibbonToggle()
                                    }
                                />
                            </ButtonTooltip>

                            <ButtonTooltip
                                tooltipText="Toggle highlights (h)"
                                position="left"
                            >
                                <button
                                    className={cx(
                                        styles.button,
                                        styles.ribbonIcon,
                                        {
                                            [styles.highlightsOn]: this.state
                                                .showHighlights,
                                            [styles.highlightsOff]: !this.state
                                                .showHighlights,
                                        },
                                    )}
                                    onClick={this.toggleHighlights}
                                />
                            </ButtonTooltip>

                            <ButtonTooltip
                                tooltipText={
                                    !this.props.isTooltipEnabled
                                        ? 'Enable Highlighter tooltip'
                                        : 'Disable Highlighter tooltip'
                                }
                                position="left"
                            >
                                <button
                                    className={cx(styles.button, {
                                        [styles.tooltipOn]: this.props
                                            .isTooltipEnabled,
                                        [styles.tooltipOff]: !this.props
                                            .isTooltipEnabled,
                                    })}
                                    onClick={() =>
                                        this.props.handleTooltipToggle()
                                    }
                                />
                            </ButtonTooltip>

                            <ButtonTooltip
                                tooltipText="Pause indexing"
                                position="left"
                            >
                                <button
                                    className={cx(styles.button, {
                                        [styles.playIcon]: this.props.isPaused,
                                        [styles.pauseIcon]: !this.props
                                            .isPaused,
                                    })}
                                    onClick={() =>
                                        this.props.handlePauseToggle()
                                    }
                                />
                            </ButtonTooltip>

                            <ButtonTooltip
                                tooltipText="Settings"
                                position="left"
                            >
                                <button
                                    className={cx(
                                        styles.button,
                                        styles.settings,
                                    )}
                                    onClick={() =>
                                        this.openOptionsTabRPC('settings')
                                    }
                                />
                            </ButtonTooltip>
                        </div>
                    </React.Fragment>
                )}
            </div>
        )
    }
}

export default Ribbon
