import React from 'react'
import PropTypes from 'prop-types'

import { LoadingIndicator } from 'src/common-ui/components'

const TestDataUpload = ({ isUploading, uploadTestData }) => (
    <div>
        <h2>Restore database from test data</h2>
        <input onChange={uploadTestData} type='file' accept='*' multiple />
        {isUploading && <LoadingIndicator />}
    </div>
)

TestDataUpload.propTypes = {
    isUploading: PropTypes.bool.isRequired,
    uploadTestData: PropTypes.func.isRequired,
}

export default TestDataUpload
