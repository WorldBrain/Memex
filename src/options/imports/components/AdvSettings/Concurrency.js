import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'

import { Wrapper } from 'src/common-ui/components'

class Concurrency extends PureComponent {
    static propTypes = {
        concurrency: PropTypes.number.isRequired,
        onConcurrencyChange: PropTypes.func.isRequired,
    }

    render() {
        return (
            <Wrapper>
                <label htmlFor="concurrency">
                    # of simultaneous downloads (max. 25)
                </label>
                <input
                    id="concurrency"
                    onChange={this.props.onConcurrencyChange}
                    value={this.props.concurrency}
                    type="number"
                    min="1"
                    max="25"
                />
            </Wrapper>
        )
    }
}

export default Concurrency
