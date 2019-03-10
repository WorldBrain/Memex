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
import Tooltip from 'src/common-ui/components/tootltip'

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
        this.setState(defaultState)
    }

    private onSearchEnter: KeyboardEventHandler<HTMLInputElement> = event => {
        if (event.key === 'Enter') {
            event.preventDefault()
            const queryFilters = extractQueryFilters(this.props.searchValue)
            this.openOverviewTabRPC(queryFilters.query)
        }
    }

    render() {
        return (
            <div
                ref={ref => (this.ribbonRef = ref)}
                className={cx(styles.ribbon, {
                    [styles.ribbonExpanded]: true,
                    // this.props.isExpanded || this.props.isSidebarOpen,
                })}
            >
                {true && (
                    // this.props.isExpanded || this.props.isSidebarOpen
                    <React.Fragment>
                        <div>
                            <button
                                onClick={() => this.openOverviewTabRPC()}
                                className={cx(styles.button, styles.dashboard)}
                                title={'Open Dashboard'}
                            />
                        </div>

                        <div>
                            <button
                                className={cx(styles.button, {
                                    [styles.arrow]: !this.props.isSidebarOpen,
                                    [styles.bookmark]: this.props.isSidebarOpen,
                                })}
                                onClick={() =>
                                    !this.props.isSidebarOpen
                                        ? this.props.openSidebar()
                                        : this.props.closeSidebar()
                                }
                                title={
                                    !this.props.isSidebarOpen
                                        ? 'Open Sidebar'
                                        : 'Close Sidebar'
                                }
                            />
                        </div>

                        <div>
                            <button
                                className={cx(styles.button, styles.search)}
                                onClick={() =>
                                    this.setState(prevState => ({
                                        showSearchBox: !prevState.showSearchBox,
                                        showCollectionsPicker: false,
                                        showTagsPicker: false,
                                        showCommentBox: false,
                                    }))
                                }
                                title={'Search Memex'}
                            />
                            {this.state.showSearchBox && (
                                <Tooltip
                                    position="left"
                                    itemClass={styles.tooltipLeft}
                                >
                                    <form>
                                        <input
                                            autoFocus={false}
                                            className={styles.searchInput}
                                            name="query"
                                            placeholder="Search your Memex"
                                            autoComplete="off"
                                            onKeyDown={this.onSearchEnter}
                                            onChange={
                                                this.props.handleSearchChange
                                            }
                                            value={this.props.searchValue}
                                        />
                                    </form>
                                </Tooltip>
                            )}
                        </div>

                        <div>
                            <button
                                className={cx(styles.button, {
                                    [styles.bookmark]: this.props.isBookmarked,
                                    [styles.notBookmark]: !this.props
                                        .isBookmarked,
                                })}
                                onClick={() =>
                                    this.props.handleBookmarkToggle()
                                }
                                title={'Star'}
                            />
                        </div>
                        <div>
                            <button
                                className={cx(styles.button, styles.comments)}
                                onClick={() =>
                                    this.setState(prevState => ({
                                        showSearchBox: false,
                                        showCollectionsPicker: false,
                                        showTagsPicker: false,
                                        showCommentBox: !prevState.showCommentBox,
                                    }))
                                }
                                title={'Add comments'}
                            />
                            {this.state.showCommentBox && (
                                <Tooltip position="left">
                                    <CommentBoxContainer
                                        env = 'inpage' />
                                </Tooltip>
                            )}
                            {this.props.isCommentSaved && (
                            <Tooltip
                                position="left"
                                itemClass={styles.commentSaved}
                            >
                            <div className={styles.saveBox}>
                                <span className={styles.saveIcon}/>
                                <span className={styles.saveText}>
                                    Saved!
                                </span>
                            </div>
                            </Tooltip>
                        )}
                        </div>

                        <div>
                            <button
                                className={cx(styles.button, styles.tag)}
                                onClick={() =>
                                    this.setState(prevState => ({
                                        showSearchBox: false,
                                        showCollectionsPicker: false,
                                        showTagsPicker: !prevState.showTagsPicker,
                                        showCommentBox: false,
                                    }))
                                }
                                title={'Add tags'}
                            />
                            {this.state.showTagsPicker && (
                                <Tooltip position="left">
                                    {this.props.tagManager}
                                </Tooltip>
                            )}
                        </div>

                        <div>
                            <button
                                className={cx(styles.button, styles.collection)}
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
                        </div>

                        <div>
                            <button
                                className={cx(styles.button, styles.settings)}
                                onClick={() =>
                                    this.openOptionsTabRPC('settings')
                                }
                                title={'Settings'}
                            />
                        </div>

                        <div>
                            <button
                                className={cx(
                                    styles.toggler,
                                    styles.ribbonIcon,
                                    {
                                        [styles.ribbonOn]: this.props
                                            .isRibbonEnabled,
                                        [styles.ribbonOff]: !this.props
                                            .isRibbonEnabled,
                                    },
                                )}
                                onClick={() => this.props.handleRibbonToggle()}
                                title={'Disable this mini sidebar'}
                            />
                        </div>

                        <div>
                            <button
                                className={cx(styles.toggler, {
                                    [styles.tooltipOn]: this.props
                                        .isTooltipEnabled,
                                    [styles.tooltipOff]: !this.props
                                        .isTooltipEnabled,
                                })}
                                onClick={() => this.props.handleTooltipToggle()}
                                title={'Disable Highlighter tooltip'}
                            />
                        </div>

                        <div>
                            <button
                                className={cx(styles.button, {
                                    [styles.playIcon]: this.props.isPaused,
                                    [styles.pauseIcon]: !this.props.isPaused,
                                })}
                                onClick={() => this.props.handlePauseToggle()}
                                title={'Pause indexing'}
                            />
                        </div>
                    </React.Fragment>
                )}
            </div>
        )
    }
}

export default Ribbon
