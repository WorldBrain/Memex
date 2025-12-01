import * as React from 'react'

interface Props {
    closePanel: () => void
}

class TutorialPanel extends React.PureComponent<Props> {
    handleClickOutside() {
        this.props.closePanel()
    }

    render() {
        return <div></div>
    }
}

export default TutorialPanel
