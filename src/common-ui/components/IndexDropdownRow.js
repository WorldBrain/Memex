import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'

import localStyles from './IndexDropdown.css'
import annotationStyles from './IndexDropdownAnnotation.css'

/**
 * @augments {PureComponent<{onClick: any}, {isForAnnotation: bool}, *>}
 */
class IndexDropdownRow extends PureComponent {
    static propTypes = {
        value: PropTypes.oneOfType([PropTypes.string, PropTypes.element])
            .isRequired,
        active: PropTypes.bool,
        onClick: PropTypes.func.isRequired,
        focused: PropTypes.bool,
        isForAnnotation: PropTypes.bool,
        allowAdd: PropTypes.bool,
    }

    componentWillMount() {
        this.styles = this.props.isForAnnotation
            ? annotationStyles
            : localStyles
    }

    get mainClass() {
        return cx(this.styles.menuItem, {
            [this.styles.menuItemFocused]: this.props.focused,
            [this.styles.commentBox]: this.props.allowAdd,
        })
    }

    render() {
        return (
            <div className={this.mainClass} onClick={this.props.onClick}>
                {this.props.value.name || this.props.value}
                {this.props.active && <i className="material-icons">done</i>}
            </div>
        )
    }
}

export default IndexDropdownRow
