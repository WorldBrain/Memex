import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'

import { LoadingIndicator, Wrapper } from 'src/common-ui/components'

class RestoreDB extends PureComponent {
    static propTypes = {
        isUploading: PropTypes.bool,
        restoreDB: PropTypes.func.isRequired,
    }

    render() {
        return (
            <Wrapper>
                <label htmlFor="test-data">Restore database dump</label>
                {this.props.isUploading && <LoadingIndicator />}
                <input
                    id="test-data"
                    onChange={this.props.restoreDB}
                    type="file"
                    accept="*"
                    multiple
                />
            </Wrapper>
        )
    }
}

export default RestoreDB
