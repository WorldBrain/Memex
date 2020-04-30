import * as React from 'react'

import { Checkbox } from '../../../common-ui/components'
import {
    convertKeyboardEventToKeyString,
    getKeyboardShortcutsState,
    setKeyboardShortcutsState,
} from 'src/content-tooltip/utils'
import { KeyboardShortcuts } from 'src/content-tooltip/types'
import { shortcuts, ShortcutElData } from '../keyboard-shortcuts'
import analytics from 'src/analytics'

const styles = require('./settings.css')

export interface Props {
    shortcutsData?: ShortcutElData[]
}

export interface State extends KeyboardShortcuts {}

class KeyboardShortcutsContainer extends React.PureComponent<Props, State> {
    static defaultProps = {
        shortcutsData: shortcuts,
    }

    state: State = {
        shortcutsEnabled: true,
        link: { shortcut: 'l', enabled: true },
        toggleSidebar: { shortcut: 'r', enabled: true },
        toggleHighlights: { shortcut: 'h', enabled: true },
        createAnnotation: { shortcut: 'a', enabled: true },
        createHighlight: { shortcut: 'n', enabled: true },
        addTag: { shortcut: 't', enabled: true },
        addComment: { shortcut: 'c', enabled: true },
        addToCollection: { shortcut: 'u', enabled: true },
        createBookmark: { shortcut: 'b', enabled: true },
    }

    async componentDidMount() {
        const keyboardShortcutsState = await getKeyboardShortcutsState()
        this.setState(keyboardShortcutsState)
    }

    handleEnabledToggle = async e => {
        const name = e.target.name as string
        const enabled = e.target.checked as boolean

        const reducer = state => {
            if (name === 'shortcutsEnabled') {
                analytics.trackEvent({
                    category: 'Settings',
                    action: enabled
                        ? 'enableKeyboardShortcuts'
                        : 'disableKeyboardShortcuts',
                })
                return { shortcutsEnabled: enabled }
            }
            return { [name]: { ...state[name], enabled } } as any
        }

        this.setState(reducer, () =>
            setKeyboardShortcutsState({ ...this.state }),
        )
    }

    recordBinding = async e => {
        e.preventDefault()

        const name = e.target.name as string

        // Afford way of clearing shortcut
        if (['Escape', 'Backspace'].includes(e.key)) {
            this.setState(
                state => ({ [name]: { ...state[name], shortcut: '' } } as any),
                () => setKeyboardShortcutsState({ ...this.state }),
            )
            return
        }

        const shortcut = convertKeyboardEventToKeyString(e)

        if (!shortcut.length) {
            return
        }

        this.setState(
            state => ({ [name]: { ...state[name], shortcut } } as any),
            () => setKeyboardShortcutsState({ ...this.state }),
        )
    }

    renderCheckboxes() {
        return this.props.shortcutsData.map(({ id, name, children }) => {
            if (this.state[name]) {
                return (
                    <Checkbox
                        key={id}
                        id={id}
                        isChecked={this.state[name].enabled}
                        handleChange={this.handleEnabledToggle}
                        isDisabled={!this.state.shortcutsEnabled}
                        name={name}
                    >
                        {children}
                        <input
                            type="text"
                            value={this.state[name].shortcut}
                            onKeyDown={this.recordBinding}
                            onChange={e => e.preventDefault()}
                            disabled={!this.state.shortcutsEnabled}
                            name={name}
                        />{' '}
                    </Checkbox>
                )
            }
        })
    }

    render() {
        return (
            <div className={styles.section}>
                <div className={styles.sectionTitle}>Keyboard Shortcuts</div>
                <div className={styles.infoText}>
                    You can also use shift, ctrl, alt, or meta to define
                    keyboard shortcuts.
                </div>
                <Checkbox
                    id="shortcuts-enabled"
                    isChecked={this.state.shortcutsEnabled}
                    handleChange={this.handleEnabledToggle}
                    name="shortcutsEnabled"
                >
                    Enable Keyboard Shortcuts
                </Checkbox>
                {this.renderCheckboxes()}
            </div>
        )
    }
}

export default KeyboardShortcutsContainer
