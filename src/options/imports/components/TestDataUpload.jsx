import React from 'react'
import PropTypes from 'prop-types'

import { LoadingIndicator, Wrapper } from 'src/common-ui/components'

const TestDataUpload = ({ isUploading, uploadTestData }) => (
    <Wrapper>
        <label htmlFor="test-data">Restore database from test data</label>
        <input
            id="test-data"
            onChange={uploadTestData}
            type="file"
            accept="*"
            multiple
        />
        {isUploading && <LoadingIndicator />}
    </Wrapper>
)

TestDataUpload.propTypes = {
    isUploading: PropTypes.bool.isRequired,
    uploadTestData: PropTypes.func.isRequired,
}

export default TestDataUpload
