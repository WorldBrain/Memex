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
        excActive: PropTypes.bool,
        onClick: PropTypes.func.isRequired,
        onExcClick: PropTypes.func,
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

    state = {
        displayExcIcon: false,
    }

    componentDidMount() {
        this.ensureVisible()
        this.ref.addEventListener('mouseenter', this.handleMouseEnter)
        this.ref.addEventListener('mouseleave', this.handleMouseLeave)
    }

    componentDidUpdate() {
        this.ensureVisible()
    }

    componentWillUnmount() {
        this.ref.removeEventListener('mouseenter', this.handleMouseEnter)
        this.ref.removeEventListener('mouseleave', this.handleMouseLeave)
    }

    handleMouseEnter = () => {
        this.setState({
            displayExcIcon: true,
        })
    }

    handleMouseLeave = () => {
        this.setState({
            displayExcIcon: false,
        })
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
                ref={ref => (this.ref = ref)}
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
                <span className={this.styles.selectionOption}>
                    {this.props.isForSidebar && (
                        <span
                            onClick={this.props.onExcClick}
                            className={cx({
                                [this.styles.excludeInactive]: this.state
                                    .displayExcIcon,
                                [this.styles.excluded]: this.props.excActive,
                            })}
                        />
                    )}
                    {this.props.active && <span className={this.styles.check} />}
                </span>
            </div>
        )
    }
}

export default IndexDropdownRow
