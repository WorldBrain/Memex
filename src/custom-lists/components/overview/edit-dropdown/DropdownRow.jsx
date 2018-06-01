import React, { PureComponent } from 'react'
import cx from 'classnames'
import PropTypes from 'prop-types'

import styles from './DropdownRow.css'

class DropdownRow extends PureComponent {
    static propTypes = {
        value: PropTypes.object.isRequired,
        focused: PropTypes.bool,
        handleClick: PropTypes.func.isRequired,
    }

    handleListStateRender = () => {
        switch (this.props.value.listUrlState) {
            case 'all':
                return <i className="material-icons">done</i>
            case 'some':
                return <span className={styles.minus}>-</span>
            default:
                return null
        }
    }

    get mainClass() {
        return cx(styles.menuItem, {
            [styles.menuItemFocused]: this.props.focused,
        })
    }

    render() {
        return (
            <div>
                <div
                    className={this.mainClass}
                    onClick={this.props.handleClick}
                >
                    <div
                        className={styles.listName}
                        title={this.props.value.name}
                    >
                        {this.props.value.name}
                    </div>
                    <span style={{ flex: 1 }}>
                        {this.handleListStateRender()}
                    </span>
                </div>
            </div>
        )
    }
}

export default DropdownRow
