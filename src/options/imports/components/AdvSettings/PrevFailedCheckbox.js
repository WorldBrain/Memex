/* eslint react/no-unused-prop-types: 0 */
import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'

import { Wrapper } from 'src/common-ui/components'

class PrevFailedCheckbox extends PureComponent {
    static propTypes = {
        checked: PropTypes.bool.isRequired,
        onChange: PropTypes.func.isRequired,
    }

    render() {
        return (
            <Wrapper>
                <label htmlFor="process-failed">
                    Include previously failed urls
                </label>
                <input id="process-failed" type="checkbox" {...this.props} />
            </Wrapper>
        )
    }
}

export default PrevFailedCheckbox
