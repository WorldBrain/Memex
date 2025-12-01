import React, { PureComponent } from 'react'
import ReactDOM from 'react-dom'
import PropTypes from 'prop-types'
import IndexDropdownUserRow from './IndexDropdownUserRow'
import { TooltipBox } from '@worldbrain/memex-common/ts/common-ui/components/tooltip-box'

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

    handleClick = (e) => {
        !this.props.excActive && this.props.onClick()
    }

    handleExcClick = (e) => {
        e.stopPropagation()
        this.props.onExcClick()
    }

    // Scroll with key navigation
    ensureVisible = () => {
        if (this.props.focused) {
            this.props.scrollIntoView(ReactDOM.findDOMNode(this))
        }
    }

    render() {
        return (
            <div ref={(ref) => (this.ref = ref)}>
                <span>Add New:</span>
                {this.props.source === 'user' ? (
                    <IndexDropdownUserRow {...this.props} />
                ) : (
                    <span>
                        {(this.props.isList && this.props.value.name) ||
                            this.props.value}
                    </span>
                )}
                <span>
                    {this.props.active && <span />}
                    {!this.props.allowAdd &&
                        this.props.isForSidebar &&
                        !this.props.active && (
                            <TooltipBox
                                tooltipText="Exclude from search"
                                placement="left"
                                getPortalRoot={null}
                            >
                                <span ref={(ref) => (this.excRef = ref)} />
                            </TooltipBox>
                        )}
                </span>
            </div>
        )
    }
}

export default IndexDropdownRow
