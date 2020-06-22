import * as React from 'react'
import onClickOutside from 'react-onclickoutside'

interface Props {
    closePanel: () => void
}

class ExtraButtonsPanel extends React.PureComponent<Props> {
    handleClickOutside() {
        this.props.closePanel()
    }

    render() {
        return <div>{this.props.children}</div>
    }
}

export default onClickOutside(ExtraButtonsPanel)
