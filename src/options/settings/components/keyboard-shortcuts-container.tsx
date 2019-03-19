import * as React from 'react'
import { Checkbox } from '../../../common-ui/components'
import * as utils from 'src/content-tooltip/utils'
import { convertKeyboardEventToKeyString } from '../../../content-tooltip/utils'
const styles = require('./settings.css')

class KeyboardShortcutsContainer extends React.PureComponent {
    state = {
        shortcutsEnabled: true,
        highlightShortcut: 'h',
        linkShortcut: 'l',
        toggleSidebarShortcut: 'r',
        toggleHighlightsShortcut: 'h',
        createAnnotationShortcut: 'a',
        highlightShortcutEnabled: true,
        linkShortcutEnabled: true,
        toggleSidebarShortcutEnabled: true,
        toggleHighlightsShortcutEnabled: true,
        createAnnotationShortcutEnabled: true,
    }
    async componentDidMount() {
        const keyboardShortcutsState = await utils.getKeyboardShortcutsState()
        this.setState(keyboardShortcutsState)
    }
    handleToggle = async e => {
        const name = e.target.name
        const value = e.target.checked
        this.setState({ [name]: value })
        await utils.setKeyboardShortcutsState({
            ...this.state,
            [name]: value,
        })
    }
    recordBinding = async e => {
        e.preventDefault()
        const binding = convertKeyboardEventToKeyString(e)
        const name = e.target.name
        this.setState({ [name]: binding })
        await utils.setKeyboardShortcutsState({
            ...this.state,
            [name]: binding,
        })
    }

    render() {
        return (
            <div>
                <h1 className={styles.header}>Keyboard Shortcuts</h1>
                <h3 className={styles.subHeader}>
                    You can also use shift, ctrl, alt, or meta to define keyboard shortcuts. 
                </h3>
                <Checkbox
                    id="shortcuts-enabled"
                    isChecked={this.state.shortcutsEnabled}
                    handleChange={this.handleToggle}
                    name="shortcutsEnabled"
                >
                    Enable Keyboard Shortcuts
                </Checkbox>
                <Checkbox
                    id="link-shortcut"
                    isChecked={this.state.linkShortcutEnabled}
                    handleChange={this.handleToggle}
                    name="linkShortcutEnabled"
                >
                    Create Links
                    <input
                        type="text"
                        value={this.state.linkShortcut}
                        onKeyDown={this.recordBinding}
                        name="linkShortcut"
                    />{' '}
                </Checkbox>
                <Checkbox
                    id="highlight-shortcut"
                    isChecked={this.state.highlightShortcutEnabled}
                    handleChange={this.handleToggle}
                    name="highlightShortcutEnabled"
                >
                    Highlight selected text
                    <input
                        type="text"
                        value={this.state.highlightShortcut}
                        onKeyDown={this.recordBinding}
                        name="highlightShortcut"
                    />{' '}
                </Checkbox>
                <Checkbox
                    id="show-highlights-shortcut"
                    isChecked={this.state.toggleHighlightsShortcutEnabled}
                    handleChange={this.handleToggle}
                    name="toggleHighlightsShortcutEnabled"
                >
                    Toggle visibility of highlights (with no text selected)
                    <input
                        type="text"
                        value={this.state.toggleHighlightsShortcut}
                        onKeyDown={this.recordBinding}
                        name="toggleHighlightsShortcut"
                    />{' '}
                </Checkbox>
                <Checkbox
                    id="sidebar-shortcut"
                    isChecked={this.state.toggleSidebarShortcutEnabled}
                    handleChange={this.handleToggle}
                    name="toggleSidebarShortcutEnabled"
                >
                    Toggle Sidebar
                    <input
                        type="text"
                        value={this.state.toggleSidebarShortcut}
                        onKeyDown={this.recordBinding}
                        name="toggleSidebarShortcut"
                    />{' '}
                </Checkbox>
                <Checkbox
                    id="annotation-shortcut"
                    isChecked={this.state.createAnnotationShortcutEnabled}
                    handleChange={this.handleToggle}
                    name="createAnnotationShortcutEnabled"
                >
                    Create Annotation
                    <input
                        type="text"
                        value={this.state.createAnnotationShortcut}
                        onKeyDown={this.recordBinding}
                        name="createAnnotationShortcut"
                    />{' '}
                </Checkbox>
            </div>
        )
    }
}

export default KeyboardShortcutsContainer
