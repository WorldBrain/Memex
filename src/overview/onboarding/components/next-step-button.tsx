import React from 'react'
import cx from 'classnames'

const styles = require('./next-step-button.css')

export interface Props {
    onClick: () => void
    color: 'green' | 'mint' | 'blue' | 'purple'
}

export default class OnboardingStep extends React.PureComponent<Props> {
    static defaultProps: Partial<Props> = {
        color: 'green',
    }

    render() {
        return (
            <div>
                <a
                    className={cx([styles.main, styles[this.props.color]])}
                    onClick={this.props.onClick}
                >
                    {this.props.children}
                </a>
            </div>
        )
    }
}
