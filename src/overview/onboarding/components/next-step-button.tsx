import React from 'react'
import cx from 'classnames'

export interface Props {
    onClick: () => void
    color: 'green' | 'mint' | 'blue' | 'prime1'
}

export default class OnboardingStep extends React.PureComponent<Props> {
    static defaultProps: Partial<Props> = {
        color: 'green',
    }

    render() {
        return (
            <div>
                <a
                    className={cx(['main', this.props.color])}
                    onClick={this.props.onClick}
                >
                    {this.props.children}
                </a>
            </div>
        )
    }
}
