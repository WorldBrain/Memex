import React, { PureComponent } from 'react'
import ReactDOM from 'react-dom'
import PropTypes from 'prop-types'
import cx from 'classnames'
import { ButtonTooltip } from '.'
import IndexDropdownUserRow from './IndexDropdownUserRow'
import styles from './IndexDropdown.css'

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
        // isForAnnotation: PropTypes.bool,
        allowAdd: PropTypes.bool,
        isForSidebar: PropTypes.bool,
        // isForRibbon: PropTypes.bool,
        scrollIntoView: PropTypes.func.isRequired,
        isNew: PropTypes.bool,
        // TODO: Fix type after refactoring this, passing in only booleans instead of numbers and booleans
        isList: PropTypes.oneOfType([PropTypes.bool, PropTypes.number]),
        source: PropTypes.string,
    }

    state = {
        displayExcIcon: false,
    }

    componentDidMount() {
        this.ensureVisible()
        this.ref.addEventListener('click', this.handleClick)
        if (this.excRef) {
            this.excRef.addEventListener('click', this.handleExcClick)
        }
        this.ref.addEventListener('mouseenter', this.handleMouseEnter)
        this.ref.addEventListener('mouseleave', this.handleMouseLeave)
    }

    componentDidUpdate() {
        if (this.excRef) {
            this.excRef.addEventListener('click', this.handleExcClick)
        }
        this.ensureVisible()
    }

    componentWillUnmount() {
        this.ref.removeEventListener('click', this.handleClick)
        if (this.excRef) {
            this.excRef.removeEventListener('click', this.handleExcClick)
        }
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

    handleClick = e => {
        !this.props.excActive && this.props.onClick()
    }

    handleExcClick = e => {
        e.stopPropagation()
        this.props.onExcClick()
    }

    // Scroll with key navigation
    ensureVisible = () => {
        if (this.props.focused) {
            this.props.scrollIntoView(ReactDOM.findDOMNode(this))
        }
    }

    get mainClass() {
        return cx(styles.menuItem, {
            [styles.menuItemFocused]: this.props.focused,
            [styles.commentBox]: this.props.allowAdd,
        })
    }

    render() {
        return (
            <div
                ref={ref => (this.ref = ref)}
                className={cx(this.mainClass, {
                    [styles.isNew]: this.props.isNew,
                    [styles.isUser]: this.props.source === 'user',
                })}
            >
                <span
                    className={cx(styles.isNewNoteInvisible, {
                        [styles.isNewNote]: this.props.isNew,
                    })}
                >
                    Add New:
                </span>
                {this.props.source === 'user' ? (
                    <IndexDropdownUserRow {...this.props} />
                ) : (
                    <span
                        className={cx(styles.tagPill, {
                            [styles.isList]:
                                this.props.isList ||
                                this.props.source === 'domain',
                        })}
                    >
                        {(this.props.isList && this.props.value.name) ||
                            this.props.value}
                    </span>
                )}
                <span className={styles.selectionOption}>
                    {this.props.active && <span className={styles.check} />}
                    {!this.props.allowAdd &&
                        this.props.isForSidebar &&
                        !this.props.active && (
                            <ButtonTooltip
                                tooltipText="Exclude from search"
                                position="left"
                            >
                                <span
                                    ref={ref => (this.excRef = ref)}
                                    className={cx({
                                        [styles.excludeInactive]:
                                            this.state.displayExcIcon &&
                                            !this.props.excActive,
                                        [styles.excluded]: this.props.excActive,
                                    })}
                                />
                            </ButtonTooltip>
                        )}
                </span>
            </div>
        )
    }
}

export default IndexDropdownRow
