import React, { PureComponent } from 'react'
import cx from 'classnames'

interface Props {
    onClick: () => void
    isSeen?: boolean
    isCurrentStep: boolean
}

export default class ProgressStep extends PureComponent<Props> {
    render() {
        return <span onClick={this.props.onClick} />
    }
}
