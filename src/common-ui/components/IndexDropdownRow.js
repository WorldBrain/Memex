import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'

import localStyles from './IndexDropdown.css'

/**
 * @augments {PureComponent<{onClick: any}, *>}
 */
class IndexDropdownRow extends PureComponent {
    static propTypes = {
        value: PropTypes.oneOfType([PropTypes.string, PropTypes.element])
            .isRequired,
        active: PropTypes.bool,
        onClick: PropTypes.func.isRequired,
        focused: PropTypes.bool,
    }

    get mainClass() {
        return cx(localStyles.menuItem, {
            [localStyles.menuItemFocused]: this.props.focused,
        })
    }

    render() {
        return (
            <div className={this.mainClass} onClick={this.props.onClick}>
                {this.props.value}
                {this.props.active && <i className="material-icons">done</i>}
            </div>
        )
    }
}

export default IndexDropdownRow
