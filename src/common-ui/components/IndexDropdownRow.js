import React, { PureComponent } from 'react'
import ReactDOM from 'react-dom'
import PropTypes from 'prop-types'
import cx from 'classnames'

import localStyles from './IndexDropdown.css'
import sidebarStyles from './IndexDropdownSidebar.css'
import annotationStyles from './IndexDropdownAnnotation.css'
/**
 * @augments {PureComponent<{onClick: any, scrollIntoView: any, isForSidebar: any}, {isForAnnotation: bool}, *>}
 */
class IndexDropdownRow extends PureComponent {
    static propTypes = {
        value: PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.object,
            PropTypes.element,
        ]).isRequired,
        active: PropTypes.bool,
        onClick: PropTypes.func.isRequired,
        focused: PropTypes.bool,
        isForAnnotation: PropTypes.bool,
        allowAdd: PropTypes.bool,
        isForSidebar: PropTypes.bool,
        scrollIntoView: PropTypes.func.isRequired,
    }

    componentDidMount() {
        this.ensureVisible()
    }

    componentDidUpdate() {
        this.ensureVisible()
    }

    get styles() {
        if (this.props.isForAnnotation) {
            return annotationStyles
        } else if (this.props.isForSidebar) {
            return sidebarStyles
        }
        return localStyles
    }

    // Scroll with key navigation
    ensureVisible = () => {
        if (this.props.focused) {
            this.props.scrollIntoView(ReactDOM.findDOMNode(this))
        }
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
