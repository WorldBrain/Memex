import React, { ReactChild, PureComponent } from 'react'
import cx from 'classnames'

const styles = require('./ResultList.css')

export interface Props {
    scrollDisabled?: boolean
    children: ReactChild[] | ReactChild
}

class ResultList extends PureComponent<Props> {
    static defaultProps = {
        scrollDisabled: false,
    }

    get listHeightStyles() {
        if (!this.props.scrollDisabled) {
            return {}
        }

        // Calculate height of the list to prevent scrolling
        // Height = 90vh + amount of height scrolled
        return {
            height: 0.9 * window.innerHeight + window.pageYOffset + 20,
        }
    }

    get mainClass() {
        return cx(styles.root, { [styles.noScroll]: this.props.scrollDisabled })
    }

    render() {
        return (
            <ul className={this.mainClass} style={this.listHeightStyles}>
                {this.props.children}
            </ul>
        )
    }
}

export default ResultList
