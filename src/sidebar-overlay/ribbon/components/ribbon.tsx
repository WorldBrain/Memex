import React, {
    Component,
    ReactNode,
    KeyboardEventHandler,
    SyntheticEvent,
} from 'react'
import cx from 'classnames'

import { getExtUrl } from '../../utils'
import { remoteFunction } from 'src/util/webextensionRPC'
import extractQueryFilters from 'src/util/nlp-time-filter'
import CommentBoxContainer from 'src/sidebar-common/comment-box'
import { Tooltip, ButtonTooltip } from 'src/common-ui/components/'

const styles = require('./ribbon.css')

interface Props {
    isExpanded: boolean
    isRibbonEnabled: boolean
    isTooltipEnabled: boolean
    isSidebarOpen: boolean
    isPaused: boolean
    isBookmarked: boolean
    searchValue: string
    tagManager: ReactNode
    collectionsManager: ReactNode
    openSidebar: () => void
    closeSidebar: () => void
    handleRibbonToggle: () => void
    handleTooltipToggle: () => void
    handleRemoveRibbon: () => void
    handleBookmarkToggle: () => void
    handlePauseToggle: () => void
    handleSearchChange: (e: SyntheticEvent<HTMLInputElement>) => void
    isCommentSaved: boolean
    commentText: string
    setShowCommentBox: () => void
}

interface State {
    showCommentBox: boolean
    showSearchBox: boolean
    showTagsPicker: boolean
    showCollectionsPicker: boolean
}

const defaultState: State = {
    showCommentBox: false,
    showSearchBox: false,
    showTagsPicker: false,
    showCollectionsPicker: false,
}

class Ribbon extends Component<Props, State> {
    private openOverviewTabRPC
    private openOptionsTabRPC
    private ribbonRef: HTMLElement

    private inputQueryEl: HTMLInputElement

    private setInputRef = (el: HTMLInputElement) => (this.inputQueryEl = el)

    constructor(props: Props) {
        super(props)
        this.openOverviewTabRPC = remoteFunction('openOverviewTab')
        this.openOptionsTabRPC = remoteFunction('openOptionsTab')
        this.state = defaultState
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
                  showCommentBox: true,
                  showSearchBox: false,
                  showTagsPicker: false,
                  showCollectionsPicker: false,
              })
            : this.setState(defaultState)
    }

    private onSearchEnter: KeyboardEventHandler<HTMLInputElement> = event => {
        if (event.key === 'Enter') {
            event.preventDefault()
            const queryFilters = extractQueryFilters(this.props.searchValue)
            this.openOverviewTabRPC(queryFilters.query)
        }
    }

    private handleCommentIconBtnClick = () => {
        if (this.props.isSidebarOpen) {
            this.props.setShowCommentBox()
            return
        }
        this.setState(prevState => ({
            showSearchBox: false,
            showCollectionsPicker: false,
            showTagsPicker: false,
            showCommentBox: !prevState.showCommentBox,
        }))
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
                                    className={cx(
                                        styles.button,
                                        styles.dashboard,
                                    )}
                                />
                            </ButtonTooltip>

                            <ButtonTooltip
                                tooltipText={
                                    !this.props.isSidebarOpen
                                        ? 'Open Sidebar'
                                        : 'Close Sidebar'
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
                                            ? this.props.openSidebar()
                                            : this.props.closeSidebar()
                                    }
                                />
                            </ButtonTooltip>

                            <div>
                                <ButtonTooltip
                                    tooltipText={'Search Memex'}
                                    position="left"
                                >
                                    <button
                                        className={cx(
                                            styles.button,
                                            styles.search,
                                        )}
                                        onClick={() => {
                                            this.setState(prevState => ({
                                                showSearchBox: !prevState.showSearchBox,
                                                showCollectionsPicker: false,
                                                showTagsPicker: false,
                                                showCommentBox: false,
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
                                                        this.onSearchEnter
                                                    }
                                                    onChange={
                                                        this.props
                                                            .handleSearchChange
                                                    }
                                                    value={
                                                        this.props.searchValue
                                                    }
                                                />
                                            </form>
                                        </Tooltip>
                                    )}
                                </ButtonTooltip>
                            </div>
                        </div>
                        <div className={styles.pageActions}>
                            <ButtonTooltip tooltipText="Star" position="left">
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
                                    tooltipText="Add comments"
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
                                    tooltipText="Add tags"
                                    position="left"
                                >
                                    <button
                                        className={cx(
                                            styles.button,
                                            styles.tag,
                                        )}
                                        onClick={() =>
                                            this.setState(prevState => ({
                                                showSearchBox: false,
                                                showCollectionsPicker: false,
                                                showTagsPicker: !prevState.showTagsPicker,
                                                showCommentBox: false,
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
                                    tooltipText="Add to collections"
                                    position="left"
                                >
                                    <button
                                        className={cx(
                                            styles.button,
                                            styles.collection,
                                        )}
                                        onClick={() =>
                                            this.setState(prevState => ({
                                                showSearchBox: false,
                                                showCollectionsPicker: !prevState.showCollectionsPicker,
                                                showTagsPicker: false,
                                                showCommentBox: false,
                                            }))
                                        }
                                        title={'Add to collections'}
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
                            <ButtonTooltip
                                tooltipText="Disable this mini sidebar"
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
                                tooltipText={'Disable Highlighter tooltip'}
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
                        </div>
                    </React.Fragment>
                )}
            </div>
        )
    }
}

export default Ribbon
