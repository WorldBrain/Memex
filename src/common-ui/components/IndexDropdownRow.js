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
        isForRibbon: PropTypes.bool,
        scrollIntoView: PropTypes.func.isRequired,
        isNew: PropTypes.bool,
        isList: PropTypes.bool,
        source: PropTypes.string,
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
        } else if (this.props.isForSidebar || this.props.isForRibbon) {
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
        // console.log(this.props.isForRibbon)
        return (
            <div
                className={cx(this.mainClass, {
                    [this.styles.isNew]: this.props.isNew,
                })}
                onClick={this.props.onClick}
            >
                <span
                    className={cx(this.styles.isNewNoteInvisible, {
                        [this.styles.isNewNote]: this.props.isNew,
                    })}
                >
                    Add New:
                </span>
                <span
                    className={cx(this.styles.tagPill, {
                        [localStyles.isList]:
                            this.props.isList || this.props.source === 'domain',
                    })}
                >
                    {(this.props.isList && this.props.value.name) ||
                        this.props.value}
                </span>
                {this.props.active && <span className={this.styles.check} />}
            </div>
        )
    }
}

export default IndexDropdownRow
