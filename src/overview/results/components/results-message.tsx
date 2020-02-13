import React, { PureComponent } from 'react'
import cx from 'classnames'

const styles = require('./results-message.css')

export interface Props {
    small?: boolean
}

class ResultsMessage extends PureComponent<Props> {
    static defaultProps = {
        small: false,
    }

    get mainClass() {
        return cx(styles.resultMessage, {
            [styles.smallMessage]: this.props.small,
        })
    }

    render() {
        return <div className={this.mainClass}>{this.props.children}</div>
    }
}

export default ResultsMessage
