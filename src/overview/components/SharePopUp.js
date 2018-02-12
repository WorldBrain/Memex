import React from 'react'
import styles from './SharePopUp.css'
import Share from './Share'
import PropTypes from 'prop-types'

const SharePopUp = props => (
    <div className={styles.outer} ref={props.setShareDivRef}>
        <div className={styles.tip} />
        <div className={props.copied ? styles.copy : styles.hide}>
            URL Copied To Clipboard
        </div>
        <div className={props.copied ? styles.hide : styles.shareIcons}>
            <a>
                <img
                    src="/img/url.svg"
                    className={styles.bgimg}
                    onClick={props.onCopyURLClick}
                />
            </a>
            <Share
                href={'https://www.facebook.com/sharer.php?u=' + props.url}
                imgSrc="/img/sharefb.svg"
            />
            <Share
                href={'https://twitter.com/intent/tweet?url=' + props.url}
                imgSrc="/img/sharetwitter.svg"
            />
            <Share
                className={styles.reddit}
                href={'http://www.reddit.com/submit?url=' + props.url}
                imgSrc="/img/reddit.svg"
            />
            <Share
                className={styles.mail}
                href={'mailto:?body=' + props.url}
                imgSrc="/img/mail.svg"
            />
        </div>
    </div>
)
SharePopUp.propTypes = {
    setShareDivRef: PropTypes.func.isRequired,
    copied: PropTypes.bool,
    onCopyURLClick: PropTypes.func.isRequired,
    url: PropTypes.string.isRequired,
}
export default SharePopUp
