import React, { PureComponent } from 'react'
import ReactDOM from 'react-dom'
import cx from 'classnames'
import PropTypes from 'prop-types'

import styles from './FilteredRow.css'

class FilteredRow extends PureComponent {
    static propTypes = {
        value: PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.object,
            PropTypes.element,
        ]).isRequired,
        focused: PropTypes.bool,
        active: PropTypes.bool.isRequired,
        onClick: PropTypes.func.isRequired,
        scrollIntoView: PropTypes.func.isRequired,
    }

    componentDidMount() {
        this.ensureVisible()
    }

    componentDidUpdate() {
        this.ensureVisible()
    }

    get mainClass() {
        return cx(styles.menuItem, {
            [styles.menuItemFocused]: this.props.focused,
        })
    }

    ensureVisible = () => {
        if (this.props.focused) {
            this.props.scrollIntoView(ReactDOM.findDOMNode(this))
        }
    }

    render() {
        return (
            <div className={styles.container}>
                <div className={this.mainClass} onClick={this.props.onClick}>
                    <div className={styles.listName} title={this.props.value}>
                        {this.props.value}
                    </div>
                    {this.props.active && (
                        <button className={cx(styles.tick, styles.button)} />
                    )}
                </div>
            </div>
        )
    }
}

export default FilteredRow
