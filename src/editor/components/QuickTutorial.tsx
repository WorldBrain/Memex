import * as React from 'react'
import cx from 'classnames'
import onClickOutside from 'react-onclickoutside'
import MarkdownHelp from 'src/editor/components/MarkdownHelp'
import type {
    Shortcut,
    BaseKeyboardShortcuts,
} from 'src/in-page-ui/keyboard-shortcuts/types'
import { getKeyboardShortcutsState } from 'src/in-page-ui/keyboard-shortcuts/content_script/detection'

const styles = require('./QuickTutorial.css')

interface State {
    isLoading: boolean
}

export interface Props {
    onOutsideClick: React.MouseEventHandler
    onSettingsClick: React.MouseEventHandler<HTMLSpanElement>
}

class QuickTutorial extends React.PureComponent<Props, State> {
    state: State = { isLoading: true }
    private keyboardShortcuts: BaseKeyboardShortcuts

    async componentDidMount() {
        this.keyboardShortcuts = await getKeyboardShortcutsState()
        this.setState({ isLoading: false })
    }

    private isShortcutEnabled = (name: string) =>
        (this.keyboardShortcuts[name] as Shortcut)?.enabled

    private getOnlyShortcut = (name: string) =>
        (this.keyboardShortcuts[name] as Shortcut)?.shortcut

    handleClickOutside: React.MouseEventHandler = (e) => {
        this.props.onOutsideClick(e)
    }

    render() {
        if (this.state.isLoading) {
            return false
        }

        return (
            <div className={styles.tutorialPanel}>
                <div className={styles.Section}>
                    <div className={styles.SectionTitle}>
                        Keyboard Shortcuts{' '}
                        <span
                            onClick={this.props.onSettingsClick}
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
                                [styles.disabled]: this.isShortcutEnabled(
                                    'createBookmark',
                                ),
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
                                [styles.disabled]: this.isShortcutEnabled(
                                    'createHighlight',
                                ),
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
                                [styles.disabled]: this.isShortcutEnabled(
                                    'createAnnotation',
                                ),
                            })}
                        >
                            {this.getOnlyShortcut('createAnnotation')} <br />{' '}
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
                                [styles.disabled]: this.isShortcutEnabled(
                                    'addComment',
                                ),
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
                                [styles.disabled]: this.isShortcutEnabled(
                                    'openDashboard',
                                ),
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
                                [styles.disabled]: this.isShortcutEnabled(
                                    'addTag',
                                ),
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
                                [styles.disabled]: this.isShortcutEnabled(
                                    'addToCollection',
                                ),
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
                                [styles.disabled]: this.isShortcutEnabled(
                                    'toggleSidebar',
                                ),
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
                                [styles.disabled]: this.isShortcutEnabled(
                                    'toggleHighlights',
                                ),
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
                                window.open('https://memex.garden/tutorials')
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
                            Sharing collections, annotated pages and highlights
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
                                window.open('https://links.memex.garden/chat')
                            }
                        >
                            <span className={styles.TutorialTitle}>
                                💬 Chat with us
                            </span>
                        </div>
                        <div
                            className={styles.TutorialBlock}
                            onClick={() =>
                                window.open('https://community.memex.garden')
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
            </div>
        )
    }
}

export default onClickOutside(QuickTutorial)
