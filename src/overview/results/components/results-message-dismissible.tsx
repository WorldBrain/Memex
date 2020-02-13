import React, { PureComponent } from 'react'
import cx from 'classnames'

const styles = require('./results-message-dismissible.css')

export interface Props {
    className?: string
    onDismiss?: () => void
}

interface State {
    show: boolean
}

class ResultsMessageDismissible extends PureComponent<Props, State> {
    static defaultProps = {
        onDismiss: () => undefined,
    }

    state: State = { show: true }

    private dismiss = () => {
        this.props.onDismiss()
        this.setState(() => ({ show: false }))
    }

    render() {
        if (!this.state.show) {
            return null
        }

        return (
            <div className={cx(this.props.className, styles.container)}>
                {this.props.children}
                <button
                    className={styles.dismissButton}
                    onClick={this.dismiss}
                />
            </div>
        )
    }
}

export default ResultsMessageDismissible
