import * as React from 'react'
const styles = require('./ribbon.css')

interface Props {
    closePanel: () => void
}

class TutorialPanel extends React.PureComponent<Props> {
    handleClickOutside() {
        this.props.closePanel()
    }

    render() {
        return <div className={styles.tutorialPanel}>{this.props.children}</div>
    }
}

export default TutorialPanel
