import React from 'react'
// import PropTypes from 'prop-types'
// import classNames from 'classnames'
import { LoadingIndicator } from 'src/common-ui/components'
import localStyles from './loading-blocker.css'

export default function LoadingBlocker(props) {
    return (
        <div className={localStyles.loadingBlocker}>
            <LoadingIndicator />
        </div>
    )
}

// PrimaryButton.propTypes = {
//     children: PropTypes.node,
//     disabled: PropTypes.bool,
//     onClick: PropTypes.func.isRequired,
// }
