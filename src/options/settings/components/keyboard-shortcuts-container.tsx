import * as React from 'react'
import { Checkbox } from '../../../common-ui/components'
import * as utils from 'src/content-tooltip/utils'
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
    handleInputChange = async e => {
        const name = e.target.name
        const value =
            e.target.type === 'checkbox' ? e.target.checked : e.target.value
        this.setState({ [name]: value })
        await utils.setKeyboardShortcutsState({
            ...this.state,
            [name]: value,
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
                <h3 className={styles.subHeader}>
                    For modifier keys you can use shift, ctrl, alt, or meta.
                    <br />
                    Examples - ctrl+s, alt+shift+Y, meta+r
                </h3>
                <Checkbox
                    id="shortcuts-enabled"
                    isChecked={this.state.shortcutsEnabled}
                    handleChange={this.handleInputChange}
                    name="shortcutsEnabled"
                >
                    Enable Keyboard Shortcuts
                </Checkbox>
                <Checkbox
                    id="link-shortcut"
                    isChecked={this.state.linkShortcutEnabled}
                    handleChange={this.handleInputChange}
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
                    handleChange={this.handleInputChange}
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
                    handleChange={this.handleInputChange}
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
                    handleChange={this.handleInputChange}
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
                    handleChange={this.handleInputChange}
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

export default KeyboardShortcutsContainer
