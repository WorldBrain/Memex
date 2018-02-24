import React from 'react'
import PropTypes from 'prop-types'
import niceTime from 'src/util/nice-time'

// import styles from './ResultItem.css'

// Temporary fix for css
const styles = {
    url: {
        fontSize: 12,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        color: '#888',
        whiteSpace: 'nowrap',
    },
    displayTime: {
        fontSize: 12,
        color: '#c1c1c1',
        paddingBottom: 7,
    },
}

const ResultItem = props => {
    return (
        <div>
            <a className="root" href={props.url} target="_blank">
                {props.content.title}
            </a>
            <div className="descriptionContainer">
                <div className="url" style={styles.url}>
                    {props.url}
                </div>
                <div className="time">
                    <div className="displayTime" style={styles.displayTime}>
                        {' '}
                        {niceTime(+props.displayTime)}{' '}
                    </div>
                </div>
            </div>
        </div>
    )
}
ResultItem.propTypes = {
    displayTime: PropTypes.string.isRequired,
    url: PropTypes.string.isRequired,
    content: PropTypes.object.isRequired,
}
export default ResultItem
