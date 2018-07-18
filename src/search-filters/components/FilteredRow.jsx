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
        isExclusive: PropTypes.bool.isRequired,
        onClick: PropTypes.func.isRequired,
        scrollIntoView: PropTypes.func,
        // If the fearure is available yet
        available: PropTypes.bool,
    }

    static defaultProps = {
        isExclusive: false,
        available: true,
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
                    {this.props.isExclusive && (
                        <button
                            className={cx(styles.exclusion, styles.button)}
                        />
                    )}
                    {this.props.active &&
                        this.props.available && (
                            <button
                                className={cx(styles.tick, styles.button)}
                            />
                        )}
                    {this.props.active &&
                        !this.props.available && (
                            <span className={styles.soon}>Soon</span>
                        )}
                </div>
            </div>
        )
    }
}

export default FilteredRow
