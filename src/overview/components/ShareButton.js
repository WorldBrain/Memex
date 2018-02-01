import React from 'react'
import PropTypes from 'prop-types'

import { OutLink } from 'src/common-ui/containers'
import styles from './ShareButtons.css'

const ShareButton = ({ imgSrc, children, ...anchorProps }) => (
    <OutLink {...anchorProps}>
        {imgSrc ? (
            <img className={styles.shareImg} vspace={2} src={imgSrc} />
        ) : (
            children
        )}
    </OutLink>
)

ShareButton.propTypes = {
    imgSrc: PropTypes.string,
    children: PropTypes.string,
}

export default ShareButton
