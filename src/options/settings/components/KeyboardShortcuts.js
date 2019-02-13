import * as React from 'react'
import { Checkbox } from '../../../common-ui/components'
import * as utils from 'src/content-tooltip/utils'
const styles = require('./settings.css')

class KeyboardShortcuts extends React.PureComponent {
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
    handleCheckboxToggle = async e => {
        const name = e.target.name
        const value = e.target.checked
        this.setState({ [name]: value })
        await utils.setKeyboardShortcutsState({
            ...this.state,
            [name]: value,
        })
    }

    handleInputChange = async e => {
        e.persist()
        const name = e.target.name
        this.setState({ [name]: e.target.value })
        await utils.setKeyboardShortcutsState({
            ...this.state,
            [name]: e.target.value,
        })
    }

    render() {
        return (
            <div>
                <h1 className={styles.header}>Keyboard Shortcuts</h1>
                <h3 className={styles.subHeader}>
                    Settings for the Keyboard Shortcuts for highlighting,
                    annotating etc.
                </h3>
                <Checkbox
                    id="shortcuts-enabled"
                    isChecked={this.state.shortcutsEnabled}
                    handleChange={this.handleCheckboxToggle}
                    name="shortcutsEnabled"
                >
                    Enable Keyboard Shortcuts
                </Checkbox>
                <Checkbox
                    id="link-shortcut"
                    isChecked={this.state.linkShortcutEnabled}
                    handleChange={this.handleCheckboxToggle}
                    name="linkShortcutEnabled"
                >
                    Create Links
                    <input
                        type="text"
                        value={this.state.linkShortcut}
                        onChange={this.handleInputChange}
                        name="linkShortcut"
                    />{' '}
                </Checkbox>
                <Checkbox
                    id="highlight-shortcut"
                    isChecked={this.state.highlightShortcutEnabled}
                    handleChange={this.handleCheckboxToggle}
                    name="highlightShortcutEnabled"
                >
                    Highlight selected text
                    <input
                        type="text"
                        value={this.state.highlightShortcut}
                        onChange={this.handleInputChange}
                        name="highlightShortcut"
                    />{' '}
                </Checkbox>
                <Checkbox
                    id="show-highlights-shortcut"
                    isChecked={this.state.toggleHighlightsShortcutEnabled}
                    handleChange={this.handleCheckboxToggle}
                    name="toggleHighlightsShortcutEnabled"
                >
                    Toggle visibility of highlights (with no text selected)
                    <input
                        type="text"
                        value={this.state.toggleHighlightsShortcut}
                        onChange={this.handleInputChange}
                        name="toggleHighlightsShortcut"
                    />{' '}
                </Checkbox>
                <Checkbox
                    id="sidebar-shortcut"
                    isChecked={this.state.toggleSidebarShortcutEnabled}
                    handleChange={this.handleCheckboxToggle}
                    name="toggleSidebarShortcutEnabled"
                >
                    Toggle Sidebar
                    <input
                        type="text"
                        value={this.state.toggleSidebarShortcut}
                        onChange={this.handleInputChange}
                        name="toggleSidebarShortcut"
                    />{' '}
                </Checkbox>
                <Checkbox
                    id="annotation-shortcut"
                    isChecked={this.state.createAnnotationShortcutEnabled}
                    handleChange={this.handleCheckboxToggle}
                    name="createAnnotationShortcutEnabled"
                >
                    Create Annotation
                    <input
                        type="text"
                        value={this.state.createAnnotationShortcut}
                        onChange={this.handleInputChange}
                        name="createAnnotationShortcut"
                    />{' '}
                </Checkbox>
            </div>
        )
    }
}

export default KeyboardShortcuts
