import * as React from 'react'

import { Checkbox } from '../../../common-ui/components'
import * as utils from 'src/content-tooltip/utils'
import { convertKeyboardEventToKeyString } from '../../../content-tooltip/utils'
import { KeyboardShortcuts } from 'src/content-tooltip/types'
import { shortcuts, ShortcutElData } from '../keyboard-shortcuts'

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
        highlight: { shortcut: 'n', enabled: true },
        link: { shortcut: 'l', enabled: true },
        toggleSidebar: { shortcut: 'r', enabled: true },
        toggleHighlights: { shortcut: 'h', enabled: true },
        createAnnotation: { shortcut: 'a', enabled: true },
        addTag: { shortcut: 't', enabled: true },
        addComment: { shortcut: 'c', enabled: true },
        addToCollection: { shortcut: 'u', enabled: true },
        createBookmark: { shortcut: 'b', enabled: true },
    }

    async componentDidMount() {
        const keyboardShortcutsState = await utils.getKeyboardShortcutsState()
        this.setState(keyboardShortcutsState)
    }

    handleEnabledToggle = async e => {
        const name = e.target.name as string
        const value = e.target.checked as boolean

        const reducer = state => {
            if (name === 'shortcutsEnabled') {
                return { shortcutsEnabled: value }
            }
            return { [name]: { ...state[name], enabled: value } } as any
        }

        this.setState(reducer, () =>
            utils.setKeyboardShortcutsState({ ...this.state }),
        )
    }

    recordBinding = async e => {
        e.preventDefault()
        const shortcut = convertKeyboardEventToKeyString(
            e,
            event => event.target.value,
        )
        const name = e.target.name as string

        this.setState(
            state => ({ [name]: { ...state[name], shortcut } } as any),
            () => utils.setKeyboardShortcutsState({ ...this.state }),
        )
    }

    renderCheckboxes() {
        return this.props.shortcutsData.map(({ id, name, children }) => (
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
                    onChange={this.recordBinding}
                    name={name}
                />{' '}
            </Checkbox>
        ))
    }

    render() {
        return (
            <div>
                <h1 className={styles.header}>Keyboard Shortcuts</h1>
                <h3 className={styles.subHeader}>
                    You can also use shift, ctrl, alt, or meta to define
                    keyboard shortcuts.
                </h3>
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
