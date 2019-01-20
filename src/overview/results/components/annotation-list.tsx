import React, { Component } from 'react'
import cx from 'classnames'

const styles = require('./annotation-list.css')

export interface Props {}

export interface State {
    isExpanded: boolean
}

class AnnotationList extends Component<Props, State> {
    state = {
        isExpanded: false,
    }

    handleArrowClick = () => {
        this.setState(
            (prevState: State): State => ({
                isExpanded: !prevState.isExpanded,
            }),
        )
    }

    render() {
        const { isExpanded } = this.state
        return (
            <div className={styles.container}>
                <span
                    className={cx(styles.icon, {
                        [styles.inverted]: isExpanded,
                    })}
                    onClick={this.handleArrowClick}
                />
            </div>
        )
    }
}

export default AnnotationList
