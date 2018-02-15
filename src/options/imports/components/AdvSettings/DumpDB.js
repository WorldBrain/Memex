import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'

import { LoadingIndicator, Wrapper } from 'src/common-ui/components'

class DumpDB extends PureComponent {
    static propTypes = {
        isLoading: PropTypes.bool,
        dumpDB: PropTypes.func.isRequired,
    }

    render() {
        return (
            <Wrapper>
                <label htmlFor="test-data">Dump database</label>
                {this.props.isLoading && <LoadingIndicator />}
                <input
                    onClick={this.props.dumpDB}
                    type="button"
                    value="Click to download"
                />
            </Wrapper>
        )
    }
}

export default DumpDB
