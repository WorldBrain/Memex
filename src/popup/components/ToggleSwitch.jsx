import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'

class ToggleSwitch extends PureComponent {
    static propTypes = {
        isChecked: PropTypes.bool.isRequired,
        onChange: PropTypes.func.isRequired,
        contentType: PropTypes.string,
    }

    static defaultProps = {
        contentType: 'pages',
    }

    render() {
        return (
            <span>
                <label>
                    <input
                        checked={this.props.isChecked}
                        onChange={this.props.onChange}
                        type="checkbox"
                    />
                </label>
                <span onClick={this.props.onChange}>
                    {this.props.isChecked ? 'On' : 'Off'}
                </span>
                <p>on all {this.props.contentType}</p>
            </span>
        )
    }
}

export default ToggleSwitch
