import React, { PureComponent } from 'react'
import ReactDOM from 'react-dom'
import PropTypes from 'prop-types'

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

    ensureVisible = () => {
        if (this.props.focused) {
            this.props.scrollIntoView(ReactDOM.findDOMNode(this))
        }
    }

    render() {
        return (
            <div>
                <div onClick={this.props.onClick}>
                    <div title={this.props.value}>{this.props.value}</div>
                    {this.props.isExclusive && this.props.available && (
                        <button title={'Results from this domain excluded'} />
                    )}
                    {this.props.active && this.props.available && <button />}
                    {this.props.active && !this.props.available && (
                        <span>Soon</span>
                    )}
                </div>
            </div>
        )
    }
}

export default FilteredRow
