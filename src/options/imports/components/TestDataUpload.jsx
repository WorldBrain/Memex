import React from 'react'
import PropTypes from 'prop-types'

import { LoadingIndicator } from 'src/common-ui/components'

import styles from './DevOptions.css'

const TestDataUpload = ({ isUploading, uploadTestData }) => (
    <div className={styles.uploadContainer}>
        <div className={styles.uploadInput}>
            <h3>Restore database from test data</h3>
            <input onChange={uploadTestData} type="file" accept="*" multiple />
        </div>
        <div className={styles.uploadLoading}>
            {isUploading && <LoadingIndicator />}
        </div>
    </div>
)

TestDataUpload.propTypes = {
    isUploading: PropTypes.bool.isRequired,
    uploadTestData: PropTypes.func.isRequired,
}

export default TestDataUpload
