import React, { Component, ReactNode, KeyboardEventHandler } from 'react'
import cx from 'classnames'
import qs from 'query-string'

import extractQueryFilters from 'src/util/nlp-time-filter'
import CommentBox from 'src/in-page-ui/components/comment-box/comment-box'
import { Tooltip, ButtonTooltip } from 'src/common-ui/components/'
import {
    shortcuts,
    ShortcutElData,
} from 'src/options/settings/keyboard-shortcuts'
import * as getKeyboardShortcutsState from 'src/in-page-ui/keyboard-shortcuts/content_script/detection'
import {
    KeyboardShortcuts,
    Shortcut,
} from 'src/in-page-ui/keyboard-shortcuts/types'
import TextInputControlled from 'src/common-ui/components/TextInputControlled'
import { highlightAnnotations } from 'src/annotations'
import { HighlightInteractionInterface, Anchor } from 'src/highlighting/types'
import { RibbonSubcomponentProps } from './types'
import TagPicker from 'src/tags/ui/TagPicker'
import CollectionPicker from 'src/custom-lists/ui/CollectionPicker'

const styles = require('./ribbon.css')

export interface Props extends RibbonSubcomponentProps {
    getRemoteFunction: (name: string) => (...args: any[]) => Promise<any>
    tabId: number
    isExpanded: boolean
    isRibbonEnabled: boolean
    shortcutsData?: ShortcutElData[]
    handleRibbonToggle: () => void
    handleRemoveRibbon: () => void
    getUrl: () => string
    highlighter: Pick<HighlightInteractionInterface, 'removeHighlights'>
    hideOnMouseLeave?: boolean
}

interface State {
    shortcutsReady: boolean
}

export default class Ribbon extends Component<Props, State> {
    static defaultProps = { shortcutsData: shortcuts }

    private keyboardShortcuts: KeyboardShortcuts
    private shortcutsData: Map<string, ShortcutElData>
    private openOverviewTabRPC
    private openOptionsTabRPC
    private ribbonRef: HTMLElement

    state: State = { shortcutsReady: false }

    constructor(props: Props) {
        super(props)
        this.shortcutsData = new Map(
            props.shortcutsData.map((s) => [s.name, s]) as [
                string,
                ShortcutElData,
            ][],
        )
        this.openOverviewTabRPC = this.props.getRemoteFunction(
            'openOverviewTab',
        )
        this.openOptionsTabRPC = this.props.getRemoteFunction('openOptionsTab')
    }

    async componentDidMount() {
        this.keyboardShortcuts = await getKeyboardShortcutsState.getKeyboardShortcutsState()
        this.setState(() => ({ shortcutsReady: true }))

        if (this.props.hideOnMouseLeave) {
            this.ribbonRef.addEventListener('mouseleave', this.handleMouseLeave)
        }
    }

    componentWillUnmount() {
        if (this.ribbonRef && this.props.hideOnMouseLeave) {
            this.ribbonRef.removeEventListener(
                'mouseleave',
                this.handleMouseLeave,
            )
        }
    }

    private handleMouseLeave = () => {
        if (!this.props.sidebar.isSidebarOpen) {
            const value = this.props.commentBox.commentText.length > 0
            this.props.commentBox.setShowCommentBox(value)
        }
    }

    private handleSearchEnterPress: KeyboardEventHandler<HTMLInputElement> = (
        event,
    ) => {
        const queryFilters = extractQueryFilters(this.props.search.searchValue)
        const queryParams = qs.stringify(queryFilters)

        this.openOverviewTabRPC(queryParams)
    }

    private handleCommentIconBtnClick = () => {
        if (this.props.sidebar.isSidebarOpen) {
            this.props.sidebar.setShowSidebarCommentBox(true)
            return
        }
        this.props.commentBox.setShowCommentBox(
            !this.props.commentBox.showCommentBox,
        )
    }

    private toggleHighlights = async () => {
        if (this.props.highlights.areHighlightsEnabled) {
            this.props.highlighter.removeHighlights()
        } else {
            highlightAnnotations()
        }

        await this.props.highlights.handleHighlightsToggle()
    }

    private getTooltipText(name: string): string {
        const elData = this.shortcutsData.get(name)
        const short: Shortcut = this.keyboardShortcuts[name]

        if (!elData) {
            return ''
        }

        let source = elData.tooltip

        if (['createBookmark', 'toggleSidebar'].includes(name)) {
            source = this.props.bookmark.isBookmarked
                ? elData.toggleOff
                : elData.toggleOn
        }

        return short.shortcut && short.enabled
            ? `${source} (${short.shortcut})`
            : source
    }

    private renderTagsManager() {
        return (
            <TagPicker
                onUpdateEntrySelection={this.props.tagging.updateTags}
                queryEntries={this.props.tagging.queryTagSuggestions}
                initialSelectedEntries={
                    this.props.tagging.fetchInitialTagSelections
                }
                loadDefaultSuggestions={
                    this.props.tagging.fetchInitialTagSuggestions
                }
            />
        )
    }

    private renderCollectionsManager() {
        return (
            <CollectionPicker
                onUpdateEntrySelection={this.props.lists.updateLists}
                queryEntries={this.props.lists.queryListSuggestions}
                initialSelectedEntries={
                    this.props.lists.fetchInitialListSelections
                }
                loadDefaultSuggestions={
                    this.props.lists.fetchInitialListSuggestions
                }
            />
        )
    }

    render() {
        if (!this.state.shortcutsReady) {
            return false
        }

        return (
            <div
                ref={(ref) => (this.ribbonRef = ref)}
                className={cx(styles.ribbon, {
                    [styles.ribbonExpanded]: this.props.isExpanded,
                    [styles.ribbonSidebarOpen]: this.props.sidebar
                        .isSidebarOpen,
                })}
            >
                <div
                    className={cx(styles.innerRibbon, {
                        [styles.innerRibbonExpanded]: this.props.isExpanded,
                        [styles.innerRibbonSidebarOpen]: this.props.sidebar
                            .isSidebarOpen,
                    })}
                >
                    {(this.props.isExpanded ||
                        this.props.sidebar.isSidebarOpen) && (
                        <React.Fragment>
                            <div className={styles.generalActions}>
                                <ButtonTooltip
                                    tooltipText={'Close Toolbar Once.'}
                                    position="left"
                                >
                                    <button
                                        className={cx(
                                            styles.button,
                                            styles.cancel,
                                        )}
                                        onClick={() =>
                                            this.props.handleRemoveRibbon()
                                        }
                                    />
                                </ButtonTooltip>
                                <ButtonTooltip
                                    tooltipText={this.getTooltipText(
                                        'toggleSidebar',
                                    )}
                                    position="left"
                                >
                                    <div
                                        className={cx(styles.button, {
                                            [styles.arrow]: !this.props.sidebar
                                                .isSidebarOpen,
                                            [styles.arrowReverse]: this.props
                                                .sidebar.isSidebarOpen,
                                        })}
                                        onClick={() =>
                                            !this.props.sidebar.isSidebarOpen
                                                ? this.props.sidebar.openSidebar(
                                                      {},
                                                  )
                                                : this.props.sidebar.closeSidebar()
                                        }
                                    />
                                </ButtonTooltip>
                                <ButtonTooltip
                                    tooltipText="Open Memex Dashboard"
                                    position="left"
                                >
                                    <div
                                        onClick={() =>
                                            this.openOverviewTabRPC()
                                        }
                                        className={cx(
                                            styles.button,
                                            styles.logo,
                                        )}
                                    />
                                </ButtonTooltip>
                                <ButtonTooltip
                                    tooltipText={'Search Memex via Dashboard'}
                                    position="left"
                                >
                                    <div
                                        className={cx(
                                            styles.button,
                                            styles.search,
                                        )}
                                        onClick={() => {
                                            this.props.search.setShowSearchBox(
                                                !this.props.search
                                                    .showSearchBox,
                                            )
                                        }}
                                    />
                                    {this.props.search.showSearchBox && (
                                        <Tooltip
                                            position="left"
                                            itemClass={styles.tooltipLeft}
                                            toolTipType="searchBar"
                                        >
                                            <form>
                                                <span
                                                    className={styles.search}
                                                />
                                                <TextInputControlled
                                                    autoFocus
                                                    className={
                                                        styles.searchInput
                                                    }
                                                    name="query"
                                                    placeholder="Search your Memex"
                                                    autoComplete="off"
                                                    onChange={
                                                        this.props.search
                                                            .setSearchValue
                                                    }
                                                    specialHandlers={[
                                                        {
                                                            test: (e) =>
                                                                e.key ===
                                                                'Enter',
                                                            handle: (e) =>
                                                                this.handleSearchEnterPress(
                                                                    e,
                                                                ),
                                                        },
                                                    ]}
                                                    defaultValue={
                                                        this.props.search
                                                            .searchValue
                                                    }
                                                    type="input"
                                                />
                                            </form>
                                        </Tooltip>
                                    )}
                                </ButtonTooltip>
                            </div>
                            <div className={styles.horizontalLine} />
                            <div className={styles.pageActions}>
                                <ButtonTooltip
                                    tooltipText={this.getTooltipText(
                                        'createBookmark',
                                    )}
                                    position="left"
                                >
                                    <div
                                        className={cx(styles.button, {
                                            [styles.bookmark]: this.props
                                                .bookmark.isBookmarked,
                                            [styles.notBookmark]: !this.props
                                                .bookmark.isBookmarked,
                                        })}
                                        onClick={() =>
                                            this.props.bookmark.toggleBookmark()
                                        }
                                    />
                                </ButtonTooltip>
                                <ButtonTooltip
                                    tooltipText={this.getTooltipText(
                                        'addComment',
                                    )}
                                    position="left"
                                >
                                    <div
                                        className={cx(
                                            styles.button,
                                            styles.comments,
                                        )}
                                        onClick={this.handleCommentIconBtnClick}
                                    />
                                    {this.props.commentBox.showCommentBox && (
                                        <Tooltip position="left">
                                            {
                                                <CommentBox
                                                    env="inpage"
                                                    closeComments={() =>
                                                        this.props.commentBox.setShowCommentBox(
                                                            false,
                                                        )
                                                    }
                                                    saveComment={
                                                        this.props.commentBox
                                                            .saveComment
                                                    }
                                                    form={{
                                                        env: 'inpage',
                                                        ...this.props
                                                            .commentBox,
                                                        toggleBookmark: this
                                                            .props.commentBox
                                                            .toggleCommentBookmark,
                                                        updateTags: this.props
                                                            .commentBox
                                                            .updateCommentTags,
                                                    }}
                                                />
                                            }
                                        </Tooltip>
                                    )}
                                    {this.props.commentBox.isCommentSaved && (
                                        <Tooltip
                                            position="left"
                                            itemClass={styles.commentSaved}
                                        >
                                            <div className={styles.saveBox}>
                                                <span
                                                    className={styles.saveIcon}
                                                />
                                            </div>
                                        </Tooltip>
                                    )}
                                </ButtonTooltip>
                                <ButtonTooltip
                                    tooltipText={this.getTooltipText('addTag')}
                                    position="left"
                                >
                                    <div
                                        className={cx(
                                            styles.button,
                                            styles.tag,
                                        )}
                                        onClick={() =>
                                            this.props.tagging.setShowTagsPicker(
                                                !this.props.tagging
                                                    .showTagsPicker,
                                            )
                                        }
                                    />
                                    {this.props.tagging.showTagsPicker && (
                                        <Tooltip position="left">
                                            {this.renderTagsManager()}
                                        </Tooltip>
                                    )}
                                </ButtonTooltip>

                                <ButtonTooltip
                                    tooltipText={this.getTooltipText(
                                        'addToCollection',
                                    )}
                                    position="left"
                                >
                                    <div
                                        className={cx(
                                            styles.button,
                                            styles.collection,
                                        )}
                                        onClick={() =>
                                            this.props.lists.setShowListsPicker(
                                                !this.props.lists
                                                    .showListsPicker,
                                            )
                                        }
                                    />
                                    {this.props.lists.showListsPicker && (
                                        <Tooltip
                                            position="left"
                                            itemClass={styles.collectionDiv}
                                        >
                                            {this.renderCollectionsManager()}
                                        </Tooltip>
                                    )}
                                </ButtonTooltip>
                            </div>
                            <div className={styles.horizontalLine} />
                            <div className={styles.settingsActions}>
                                <ButtonTooltip
                                    tooltipText="Disable this Toolbar (You can still use keyboard shortcuts)"
                                    position="left"
                                >
                                    <div
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
                                        onClick={() => {
                                            this.props.handleRibbonToggle()
                                            this.props.sidebar.closeSidebar()
                                        }}
                                    />
                                </ButtonTooltip>

                                <ButtonTooltip
                                    tooltipText="Toggle highlights"
                                    position="left"
                                >
                                    <div
                                        onClick={this.toggleHighlights}
                                        className={cx(
                                            styles.button,
                                            styles.ribbonIcon,
                                            {
                                                [styles.highlightsOn]: this
                                                    .props.highlights
                                                    .areHighlightsEnabled,
                                                [styles.highlightsOff]: !this
                                                    .props.highlights
                                                    .areHighlightsEnabled,
                                            },
                                        )}
                                    />
                                </ButtonTooltip>

                                <ButtonTooltip
                                    tooltipText="Toggle tooltip"
                                    position="left"
                                >
                                    <div
                                        onClick={
                                            this.props.tooltip
                                                .handleTooltipToggle
                                        }
                                        className={cx(
                                            styles.button,
                                            styles.ribbonIcon,
                                            {
                                                [styles.tooltipOn]: this.props
                                                    .tooltip.isTooltipEnabled,
                                                [styles.tooltipOff]: !this.props
                                                    .tooltip.isTooltipEnabled,
                                            },
                                        )}
                                    />
                                </ButtonTooltip>

                                <ButtonTooltip
                                    tooltipText="Pause indexing"
                                    position="left"
                                >
                                    <div
                                        className={cx(styles.button, {
                                            [styles.playIcon]: this.props
                                                .pausing.isPaused,
                                            [styles.pauseIcon]: !this.props
                                                .pausing.isPaused,
                                        })}
                                        onClick={() =>
                                            this.props.pausing.handlePauseToggle()
                                        }
                                    />
                                </ButtonTooltip>

                                <ButtonTooltip
                                    tooltipText="Settings"
                                    position="left"
                                >
                                    <div
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
            </div>
        )
    }
}
