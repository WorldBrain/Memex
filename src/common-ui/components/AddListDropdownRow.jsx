import React, { PureComponent } from 'react'
import cx from 'classnames'
import PropTypes from 'prop-types'

import styles from './AddListDropdownRow.css'

class AddListDropdownRow extends PureComponent {
    static propTypes = {
        value: PropTypes.object.isRequired,
        focused: PropTypes.bool,
        handleClick: PropTypes.func.isRequired,
        isActive: PropTypes.bool.isRequired,
    }

    handleListStateRender = () => {
        switch (this.props.value.listUrlState) {
            case 'all':
                return <i className="material-icons">done</i>
            case 'some':
                return (
                    <span
                        className={styles.minus}
                        title={`Only some of the selected element(s) are on this list/have this tag.
                        Click once to remove all, twice to add all, three
                        times to go back to default`}
                    >
                        -
                    </span>
                )
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
                        {this.props.isActive && (
                            <i className="material-icons">done</i>
                        )}
                    </span>
                </div>
            </div>
        )
    }
}

export default AddListDropdownRow
