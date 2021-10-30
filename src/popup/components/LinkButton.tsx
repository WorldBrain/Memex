import React, { PureComponent } from 'react'

import OutLink from 'src/common-ui/containers/OutLink'
import Button from './Button'
import { getKeyboardShortcutsState } from 'src/in-page-ui/keyboard-shortcuts/content_script/detection'

const styles = require('./Button.css')
const LinkButtonStyles = require('src/popup/collections-button/components/CollectionsButton.css')

interface Props {
    goToDashboard: () => void
}

class LinkButton extends PureComponent<Props> {
    async componentDidMount() {
        await this.getKeyboardShortcutText()
    }

    state = {
        highlightInfo: undefined,
    }

    private async getKeyboardShortcutText() {
        const {
            shortcutsEnabled,
            openDashboard,
        } = await getKeyboardShortcutsState()

        if (!shortcutsEnabled || !openDashboard.enabled) {
            this.setState({
                highlightInfo: `${openDashboard.shortcut} (disabled)`,
            })
        } else
            this.setState({
                highlightInfo: `${openDashboard.shortcut}`,
            })
    }

    render() {
        return (
            <div className={LinkButtonStyles.buttonContainer}>
                <Button
                    onClick={this.props.goToDashboard}
                    btnClass={styles.searchIcon}
                    itemClass={LinkButtonStyles.button}
                >
                    Search Memex
                    <p className={styles.subTitle}>
                        {this.state.highlightInfo}
                    </p>
                </Button>
            </div>
        )
    }
}

export default LinkButton
