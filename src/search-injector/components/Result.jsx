import React from 'react'
import PropTypes from 'prop-types'

import niceTime from 'src/util/nice-time'
import ImgFromPouch from '../../overview/components/ImgFromPouch'

// import styles from './Result.css'

const styles = {
    resultItems: {
        padding: '1%',
        margin: 'auto 0px',
        boxShadow: '0 4px 20px 1px lightgray',
        marginTop: '3px',
        marginBottom: '3px',
        display: 'flex',
    },
    displayTime: {
        fontsize: '4px',
        color: 'grey',
        paddingBottom: '1px',
        paddingTop: '1%',
    },
    externalUrl: {
        textDecoration: 'none',
    },
    screenshotContainer: {},
    title: {
        paddingBottom: '1%',
        color: '#000',
    },
    screenshot: {
        maxWidth: '100%',
        width: 'auto',
        height: 'auto',
    },
}

const Result = props => (
    <li>
        <a style={styles.externalUrl} href={props.url} target="_blank">
            <div style={styles.resultItems}>
                <div style={styles.screenshotContainer}>
                    {props._attachments && props._attachments.screenshot ? (
                        <ImgFromPouch
                            style={styles.screenshot}
                            doc={props}
                            attachmentId="screenshot"
                        />
                    ) : (
                        <img
                            style={styles.screenshot}
                            src={
                                props.egg
                                    ? props._attachments.src
                                    : chrome.extension.getURL(
                                          '/img/null-icon.png',
                                      )
                            }
                        />
                    )}
                </div>
                <div>
                    <h3 style={styles.title}>
                        {' '}
                        {props.title || props.content.title}
                    </h3>
                    <span>{props.url}</span>
                    <div style={styles.displayTime}>
                        {' '}
                        {niceTime(+props.displayTime)}{' '}
                    </div>
                </div>
            </div>
        </a>
    </li>
)

Result.propTypes = {
    _attachments: PropTypes.object,
    displayTime: PropTypes.string.isRequired,
    url: PropTypes.string.isRequired,
    title: PropTypes.string,
    egg: PropTypes.bool,
    content: PropTypes.object.isRequired,
}

export default Result
