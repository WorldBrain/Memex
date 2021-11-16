import React, { Component, KeyboardEventHandler } from 'react'
import cx from 'classnames'
import qs from 'query-string'

import extractQueryFilters from 'src/util/nlp-time-filter'
import { Tooltip, ButtonTooltip } from 'src/common-ui/components/'
import {
    shortcuts,
    ShortcutElData,
} from 'src/options/settings/keyboard-shortcuts'
import * as getKeyboardShortcutsState from 'src/in-page-ui/keyboard-shortcuts/content_script/detection'
import type {
    Shortcut,
    BaseKeyboardShortcuts,
} from 'src/in-page-ui/keyboard-shortcuts/types'
import ExtraButtonsPanel from './extra-buttons-panel'
import TutorialPanel from './tutorial-panel'
import { HighlightInteractionsInterface } from 'src/highlighting/types'
import { RibbonSubcomponentProps } from './types'
import TagPicker from 'src/tags/ui/TagPicker'
import CollectionPicker from 'src/custom-lists/ui/CollectionPicker'
import AnnotationCreate from 'src/annotations/components/AnnotationCreate'
import BlurredSidebarOverlay from 'src/in-page-ui/sidebar/react/components/blurred-overlay'
import MarkdownHelp from 'src/editor/components/MarkdownHelp'

const styles = require('./ribbon.css')

export interface Props extends RibbonSubcomponentProps {
    getRemoteFunction: (name: string) => (...args: any[]) => Promise<any>
    setRef?: (el: HTMLElement) => void
    tabId: number
    isExpanded: boolean
    isRibbonEnabled: boolean
    shortcutsData: ShortcutElData[]
    showExtraButtons: boolean
    showTutorial: boolean
    toggleShowExtraButtons: () => void
    toggleShowTutorial: () => void
    handleRibbonToggle: () => void
    handleRemoveRibbon: () => void
    getUrl: () => string
    highlighter: Pick<HighlightInteractionsInterface, 'removeHighlights'>
    hideOnMouseLeave?: boolean
}

interface State {
    shortcutsReady: boolean
}

export default class Ribbon extends Component<Props, State> {
    static defaultProps: Pick<Props, 'shortcutsData'> = {
        shortcutsData: shortcuts,
    }

    private keyboardShortcuts: BaseKeyboardShortcuts
    private shortcutsData: Map<string, ShortcutElData>
    private openOverviewTabRPC
    private openOptionsTabRPC
    private annotationCreateRef // TODO: Figure out how to properly type refs to onClickOutside HOCs

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
    }

    focusCreateForm = () => this.annotationCreateRef?.getInstance()?.focus()

    private handleSearchEnterPress: KeyboardEventHandler<HTMLInputElement> = (
        event,
    ) => {
        const queryFilters = extractQueryFilters(this.props.search.searchValue)
        const queryParams = qs.stringify(queryFilters)

        this.openOverviewTabRPC(queryParams)
        this.props.search.setShowSearchBox(false)
        this.props.search.setSearchValue('')
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

    private shortCutEnabled(name: string): string {
        const short: Shortcut = this.keyboardShortcuts[name]
        console.log(short)

        if (short.enabled !== true) {
            return 'disabled'
        }
    }

    private getOnlyShortcut(name: string): string {
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

        return `${short.shortcut}`
    }

    private hideTagPicker = () => this.props.tagging.setShowTagsPicker(false)
    private hideListPicker = () => this.props.lists.setShowListsPicker(false)

    private renderTagsPicker() {
        if (!this.props.tagging.showTagsPicker) {
            return null
        }

        return (
            <Tooltip position="left">
                <BlurredSidebarOverlay
                    onOutsideClick={this.hideTagPicker}
                    skipRendering={!this.props.sidebar.isSidebarOpen}
                >
                    <TagPicker
                        {...this.props.tagging}
                        onUpdateEntrySelection={this.props.tagging.updateTags}
                        actOnAllTabs={this.props.tagging.tagAllTabs}
                        initialSelectedEntries={
                            this.props.tagging.fetchInitialTagSelections
                        }
                        onEscapeKeyDown={this.hideTagPicker}
                        handleClickOutside={this.hideTagPicker}
                    />
                </BlurredSidebarOverlay>
            </Tooltip>
        )
    }

    private renderCollectionsPicker() {
        if (!this.props.lists.showListsPicker) {
            return null
        }

        return (
            <Tooltip position="left">
                <BlurredSidebarOverlay
                    onOutsideClick={this.hideListPicker}
                    skipRendering={!this.props.sidebar.isSidebarOpen}
                >
                    <CollectionPicker
                        {...this.props.lists}
                        onUpdateEntrySelection={this.props.lists.updateLists}
                        actOnAllTabs={this.props.lists.listAllTabs}
                        initialSelectedEntries={
                            this.props.lists.fetchInitialListSelections
                        }
                        onEscapeKeyDown={this.hideListPicker}
                        handleClickOutside={this.hideListPicker}
                    />
                </BlurredSidebarOverlay>
            </Tooltip>
        )
    }

    private renderTutorial() {
        if (!this.props.showTutorial) {
            return
        }

        return (
            <BlurredSidebarOverlay
                onOutsideClick={() => this.props.toggleShowTutorial()}
                skipRendering={!this.props.sidebar.isSidebarOpen}
            >
                <TutorialPanel
                    closePanel={() => this.props.toggleShowTutorial()}
                >
                    <div className={styles.Section}>
                        <div className={styles.SectionTitle}>
                            Keyboard Shortcuts{' '}
                            <span
                                onClick={() =>
                                    this.openOptionsTabRPC('settings')
                                }
                                className={styles.actionButton}
                            >
                                Edit Shortcuts
                            </span>
                        </div>
                        <div className={styles.KeyboardShortcutsBlock}>
                            <span className={styles.KeyboardShortcutsTitle}>
                                Save current page
                            </span>
                            <span
                                className={cx(styles.KeyboardShortcutKeys, {
                                    [styles.disabled]:
                                        this.shortCutEnabled(
                                            'createBookmark',
                                        ) === 'disabled',
                                })}
                            >
                                {this.getOnlyShortcut('createBookmark')}
                            </span>
                        </div>
                        <div className={styles.KeyboardShortcutsBlock}>
                            <span className={styles.KeyboardShortcutsTitle}>
                                Highlight selected text
                            </span>
                            <span
                                className={cx(styles.KeyboardShortcutKeys, {
                                    [styles.disabled]:
                                        this.shortCutEnabled(
                                            'createHighlight',
                                        ) === 'disabled',
                                })}
                            >
                                {this.getOnlyShortcut('createHighlight')} <br />{' '}
                                <span className={styles.shiftShare}>
                                    (+shift to share)
                                </span>
                            </span>
                        </div>
                        <div className={styles.KeyboardShortcutsBlock}>
                            <span className={styles.KeyboardShortcutsTitle}>
                                Add note to selected text
                            </span>
                            <span
                                className={cx(styles.KeyboardShortcutKeys, {
                                    [styles.disabled]:
                                        this.shortCutEnabled(
                                            'createAnnotation',
                                        ) === 'disabled',
                                })}
                            >
                                {this.getOnlyShortcut('createAnnotation')}{' '}
                                <br />{' '}
                                <span className={styles.shiftShare}>
                                    (+shift to share)
                                </span>
                            </span>
                        </div>
                        <div className={styles.KeyboardShortcutsBlock}>
                            <span className={styles.KeyboardShortcutsTitle}>
                                Add note to page
                            </span>
                            <span
                                className={cx(styles.KeyboardShortcutKeys, {
                                    [styles.disabled]:
                                        this.shortCutEnabled('addComment') ===
                                        'disabled',
                                })}
                            >
                                {this.getOnlyShortcut('addComment')}
                            </span>
                        </div>
                        <div className={styles.KeyboardShortcutsBlock}>
                            <span className={styles.KeyboardShortcutsTitle}>
                                Search pages and annotations
                            </span>
                            <span
                                className={cx(styles.KeyboardShortcutKeys, {
                                    [styles.disabled]:
                                        this.shortCutEnabled(
                                            'openDashboard',
                                        ) === 'disabled',
                                })}
                            >
                                {this.getOnlyShortcut('openDashboard')}
                            </span>
                        </div>
                        <div className={styles.KeyboardShortcutsBlock}>
                            <span className={styles.KeyboardShortcutsTitle}>
                                Add tag(s) to page
                            </span>
                            <span
                                className={cx(styles.KeyboardShortcutKeys, {
                                    [styles.disabled]:
                                        this.shortCutEnabled('addTag') ===
                                        'disabled',
                                })}
                            >
                                {this.getOnlyShortcut('addTag')}
                            </span>
                        </div>
                        <div className={styles.KeyboardShortcutsBlock}>
                            <span className={styles.KeyboardShortcutsTitle}>
                                Add page to collection
                            </span>
                            <span
                                className={cx(styles.KeyboardShortcutKeys, {
                                    [styles.disabled]:
                                        this.shortCutEnabled(
                                            'addToCollection',
                                        ) === 'disabled',
                                })}
                            >
                                {this.getOnlyShortcut('addToCollection')}
                            </span>
                        </div>
                        <div className={styles.KeyboardShortcutsBlock}>
                            <span className={styles.KeyboardShortcutsTitle}>
                                Toggle sidebar
                            </span>
                            <span
                                className={cx(styles.KeyboardShortcutKeys, {
                                    [styles.disabled]:
                                        this.shortCutEnabled(
                                            'toggleSidebar',
                                        ) === 'disabled',
                                })}
                            >
                                {this.getOnlyShortcut('toggleSidebar')}
                            </span>
                        </div>
                        <div className={styles.KeyboardShortcutsBlock}>
                            <span className={styles.KeyboardShortcutsTitle}>
                                Toggle highlights on page
                            </span>
                            <span
                                className={cx(styles.KeyboardShortcutKeys, {
                                    [styles.disabled]:
                                        this.shortCutEnabled(
                                            'toggleHighlights',
                                        ) === 'disabled',
                                })}
                            >
                                {this.getOnlyShortcut('toggleHighlights')}
                            </span>
                        </div>
                    </div>
                    <MarkdownHelp />
                    <div className={styles.Section}>
                        <div className={styles.SectionTitle}>
                            Advanced Workflows{' '}
                            <span
                                onClick={() =>
                                    window.open(
                                        'https://memex.garden/tutorials',
                                    )
                                }
                                className={styles.actionButton}
                            >
                                View All Tutorials
                            </span>
                        </div>
                        <div
                            className={styles.TutorialBlock}
                            onClick={() =>
                                window.open(
                                    'https://tutorials.memex.garden/sharing-collections-annotated-pages-and-highlights',
                                )
                            }
                        >
                            <span className={styles.TutorialTitle}>
                                Sharing collections, annotated pages and
                                highlights
                            </span>
                        </div>
                        <div
                            className={styles.TutorialBlock}
                            onClick={() =>
                                window.open(
                                    'https://tutorials.memex.garden/organise-or-tag-all-open-tabs',
                                )
                            }
                        >
                            <span className={styles.TutorialTitle}>
                                Organise or Tag all open tabs
                            </span>
                        </div>
                        <div
                            className={styles.TutorialBlock}
                            onClick={() =>
                                window.open(
                                    'https://tutorials.memex.garden/importing-to-memex-from-other-services',
                                )
                            }
                        >
                            <span className={styles.TutorialTitle}>
                                Importing to Memex from other services
                            </span>
                        </div>
                        <div
                            className={styles.TutorialBlock}
                            onClick={() =>
                                window.open(
                                    'https://tutorials.memex.garden/export-your-data-locally-to-any-cloud-provider',
                                )
                            }
                        >
                            <span className={styles.TutorialTitle}>
                                Export your data locally & to any cloud provider
                            </span>
                        </div>
                        <div
                            className={styles.TutorialBlock}
                            onClick={() =>
                                window.open(
                                    'https://tutorials.memex.garden/text-export-templates',
                                )
                            }
                        >
                            <span className={styles.TutorialTitle}>
                                Text Export Templates
                            </span>
                        </div>
                        <div className={styles.Section}>
                            <div className={styles.SectionTitle}>
                                Getting Support
                            </div>
                            <div
                                className={styles.TutorialBlock}
                                onClick={() =>
                                    window.open(
                                        'https://links.memex.garden/onboarding',
                                    )
                                }
                            >
                                <span className={styles.TutorialTitle}>
                                    ☎️ Book Onboarding Call
                                </span>
                            </div>
                            <div
                                className={styles.TutorialBlock}
                                onClick={() =>
                                    window.open(
                                        'https://links.memex.garden/chat',
                                    )
                                }
                            >
                                <span className={styles.TutorialTitle}>
                                    💬 Chat with us
                                </span>
                            </div>
                            <div
                                className={styles.TutorialBlock}
                                onClick={() =>
                                    window.open(
                                        'https://community.memex.garden',
                                    )
                                }
                            >
                                <span className={styles.TutorialTitle}>
                                    ✍🏽 Visit Forum
                                </span>
                            </div>
                            <div
                                className={styles.TutorialBlock}
                                onClick={() =>
                                    window.open(
                                        'https://links.memex.garden/announcements/pioneer-plan',
                                    )
                                }
                            >
                                <span className={styles.TutorialTitle}>
                                    💸 Get an early bird discount
                                </span>
                            </div>
                        </div>
                    </div>
                </TutorialPanel>
            </BlurredSidebarOverlay>
        )
    }

    private renderExtraButtons() {
        if (!this.props.showExtraButtons) {
            return
        }

        return (
            <BlurredSidebarOverlay
                onOutsideClick={() => this.props.toggleShowExtraButtons()}
                skipRendering={!this.props.sidebar.isSidebarOpen}
            >
                <ExtraButtonsPanel
                    closePanel={() => this.props.toggleShowExtraButtons()}
                >
                    <div
                        onClick={() => {
                            this.props.handleRibbonToggle()
                            this.props.sidebar.closeSidebar()
                        }}
                        className={styles.extraButtonRow}
                    >
                        <div
                            className={cx(
                                styles.button,
                                styles.ribbonIcon,
                                styles.extraButtons,
                                {
                                    [styles.ribbonOn]: this.props
                                        .isRibbonEnabled,
                                    [styles.ribbonOff]: !this.props
                                        .isRibbonEnabled,
                                },
                            )}
                        />
                        {this.props.isRibbonEnabled ? (
                            <div className={styles.extraButtonsText}>
                                Disable Sidebar
                            </div>
                        ) : (
                            <div className={styles.extraButtonsText}>
                                Enable Ribbon
                            </div>
                        )}
                    </div>

                    <div
                        onClick={this.props.highlights.handleHighlightsToggle}
                        className={styles.extraButtonRow}
                    >
                        <div
                            className={cx(
                                styles.button,
                                styles.ribbonIcon,
                                styles.extraButtons,
                                {
                                    [styles.highlightsOn]: this.props.highlights
                                        .areHighlightsEnabled,
                                    [styles.highlightsOff]: !this.props
                                        .highlights.areHighlightsEnabled,
                                },
                            )}
                        />
                        {this.props.highlights.areHighlightsEnabled ? (
                            <div className={styles.extraButtonsText}>
                                Hide Highlights
                            </div>
                        ) : (
                            <div className={styles.extraButtonsText}>
                                Show Highlights
                            </div>
                        )}
                    </div>

                    <div
                        onClick={this.props.tooltip.handleTooltipToggle}
                        className={styles.extraButtonRow}
                    >
                        <div
                            className={cx(
                                styles.extraButtons,
                                styles.button,
                                styles.ribbonIcon,
                                {
                                    [styles.tooltipOn]: this.props.tooltip
                                        .isTooltipEnabled,
                                    [styles.tooltipOff]: !this.props.tooltip
                                        .isTooltipEnabled,
                                },
                            )}
                        />
                        {this.props.tooltip.isTooltipEnabled ? (
                            <div className={styles.extraButtonsText}>
                                Hide Highlighter
                            </div>
                        ) : (
                            <div className={styles.extraButtonsText}>
                                Show Highlighter
                            </div>
                        )}
                    </div>
                    <div
                        onClick={() =>
                            window.open('https://worldbrain.io/tutorials')
                        }
                        className={styles.extraButtonRow}
                    >
                        <div
                            className={cx(
                                styles.button,
                                styles.helpIcon,
                                styles.extraButtons,
                            )}
                        />
                        <div className={styles.extraButtonsText}>Tutorials</div>
                    </div>
                    <div
                        onClick={() => this.openOptionsTabRPC('settings')}
                        className={styles.extraButtonRow}
                    >
                        <div
                            className={cx(
                                styles.button,
                                styles.settings,
                                styles.extraButtons,
                            )}
                        />
                        <div className={styles.extraButtonsText}>Settings</div>
                    </div>
                    <div
                        onClick={() =>
                            window.open('https://worldbrain.io/feedback')
                        }
                        className={styles.feedbackRow}
                    >
                        <div className={styles.extraButtonsText}>
                            Feature Requests & Bugs
                        </div>
                    </div>
                </ExtraButtonsPanel>
            </BlurredSidebarOverlay>
        )
    }

    render() {
        if (!this.state.shortcutsReady) {
            return false
        }

        return (
            <div
                className={cx(styles.ribbon, {
                    [styles.ribbonExpanded]: this.props.isExpanded,
                    [styles.ribbonSidebarOpen]: this.props.sidebar
                        .isSidebarOpen,
                })}
            >
                <div
                    ref={this.props.setRef}
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
                                {!this.props.sidebar.isSidebarOpen && (
                                    <>
                                        <ButtonTooltip
                                            tooltipText={
                                                'Close Toolbar for session'
                                            }
                                            position="leftNarrow"
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
                                            position="leftNarrow"
                                        >
                                            <div
                                                className={cx(styles.button, {
                                                    [styles.arrow]: !this.props
                                                        .sidebar.isSidebarOpen,
                                                    [styles.arrowReverse]: this
                                                        .props.sidebar
                                                        .isSidebarOpen,
                                                })}
                                                onClick={() =>
                                                    !this.props.sidebar
                                                        .isSidebarOpen
                                                        ? this.props.sidebar.openSidebar(
                                                              {},
                                                          )
                                                        : this.props.sidebar.closeSidebar()
                                                }
                                            />
                                        </ButtonTooltip>
                                    </>
                                )}
                                <ButtonTooltip
                                    tooltipText={this.getTooltipText(
                                        'openDashboard',
                                    )}
                                    position="leftNarrow"
                                >
                                    <div
                                        onClick={() =>
                                            this.openOverviewTabRPC()
                                        }
                                        className={cx(
                                            styles.button,
                                            styles.search,
                                        )}
                                    />
                                </ButtonTooltip>
                                {/*<ButtonTooltip
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
                                            <SearchBox
                                                {...this.props.search}
                                                onSearchEnterPress={
                                                    this.handleSearchEnterPress
                                                }
                                                onOutsideClick={() =>
                                                    this.props.search.setShowSearchBox(
                                                        false,
                                                    )
                                                }
                                            />
                                        </Tooltip>
                                    )}
                                </ButtonTooltip>*/}
                            </div>
                            <div className={styles.horizontalLine} />
                            <div className={styles.pageActions}>
                                <ButtonTooltip
                                    tooltipText={this.getTooltipText(
                                        'createBookmark',
                                    )}
                                    position="leftNarrow"
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
                                {!this.props.sidebar.isSidebarOpen && (
                                    <ButtonTooltip
                                        tooltipText={this.getTooltipText(
                                            'addComment',
                                        )}
                                        position="leftNarrow"
                                    >
                                        <div
                                            className={cx(
                                                styles.button,
                                                styles.comments,
                                                {
                                                    [styles.saveIcon]: this
                                                        .props.commentBox
                                                        .isCommentSaved,
                                                },
                                            )}
                                            onClick={
                                                this.handleCommentIconBtnClick
                                            }
                                        />
                                    </ButtonTooltip>
                                )}
                                {this.props.commentBox.showCommentBox && (
                                    <Tooltip position="left">
                                        <AnnotationCreate
                                            {...this.props.tagging}
                                            ref={(ref) =>
                                                (this.annotationCreateRef = ref)
                                            }
                                            hide={() =>
                                                this.props.commentBox.setShowCommentBox(
                                                    false,
                                                )
                                            }
                                            onSave={
                                                this.props.commentBox
                                                    .saveComment
                                            }
                                            onCancel={
                                                this.props.commentBox
                                                    .cancelComment
                                            }
                                            onTagsUpdate={
                                                this.props.commentBox
                                                    .updateCommentBoxTags
                                            }
                                            onCommentChange={
                                                this.props.commentBox
                                                    .changeComment
                                            }
                                            comment={
                                                this.props.commentBox
                                                    .commentText
                                            }
                                            tags={this.props.commentBox.tags}
                                        />
                                    </Tooltip>
                                )}
                                <ButtonTooltip
                                    tooltipText={this.getTooltipText('addTag')}
                                    position="leftNarrow"
                                >
                                    <div
                                        className={cx(styles.button, {
                                            [styles.tagFull]: this.props.tagging
                                                .pageHasTags,
                                            [styles.tag]: !this.props.tagging
                                                .pageHasTags,
                                        })}
                                        onClick={() =>
                                            this.props.tagging.setShowTagsPicker(
                                                !this.props.tagging
                                                    .showTagsPicker,
                                            )
                                        }
                                    />
                                </ButtonTooltip>
                                {this.renderTagsPicker()}
                                <ButtonTooltip
                                    tooltipText={this.getTooltipText(
                                        'addToCollection',
                                    )}
                                    position="leftNarrow"
                                >
                                    <div
                                        className={cx(styles.button, {
                                            [styles.collectionsFull]: this.props
                                                .lists.pageBelongsToList,
                                            [styles.collections]: !this.props
                                                .lists.pageBelongsToList,
                                        })}
                                        onClick={() =>
                                            this.props.lists.setShowListsPicker(
                                                !this.props.lists
                                                    .showListsPicker,
                                            )
                                        }
                                    />
                                </ButtonTooltip>
                                {this.renderCollectionsPicker()}
                                <div className={styles.horizontalLine} />
                                <ButtonTooltip
                                    tooltipText="Settings"
                                    position="leftNarrow"
                                >
                                    <div
                                        className={cx(
                                            styles.button,
                                            styles.settings,
                                        )}
                                        onClick={() =>
                                            this.props.toggleShowExtraButtons()
                                        }
                                    />
                                </ButtonTooltip>
                                {this.props.showExtraButtons && (
                                    <Tooltip position="leftSmallWidth">
                                        {this.renderExtraButtons()}
                                    </Tooltip>
                                )}
                                <ButtonTooltip
                                    tooltipText="Quick Tutorial & Help"
                                    position="leftNarrow"
                                >
                                    <div
                                        className={cx(
                                            styles.button,
                                            styles.help,
                                        )}
                                        onClick={() =>
                                            this.props.toggleShowTutorial()
                                        }
                                    />
                                </ButtonTooltip>
                                {this.props.showTutorial && (
                                    <Tooltip position="leftTutorial">
                                        {this.renderTutorial()}
                                    </Tooltip>
                                )}
                            </div>
                            {/*
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
                                        onClick={
                                            this.props.highlights
                                                .handleHighlightsToggle
                                        }
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
                                </ButtonTooltip> */}
                            {/* </div> */}
                        </React.Fragment>
                    )}
                </div>
            </div>
        )
    }
}
