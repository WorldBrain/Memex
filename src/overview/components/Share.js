import React from 'react'
import PropTypes from 'prop-types'

import { OutLink } from 'src/common-ui/containers'
import styles from './SharePopup.css'

const Share = ({ imgSrc, children, ...anchorProps }) => (
    <OutLink {...anchorProps}>
        {imgSrc ? (
            <img className={styles.shareImg} vspace={2} src={imgSrc} />
        ) : (
            children
        )}
    </OutLink>
)

Share.propTypes = {
    imgSrc: PropTypes.string,
    children: PropTypes.string,
}

export default Share
