import React, { Component } from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'

import styles from './Index.css'

class PageList extends Component {
    static propTypes = {
        listName: PropTypes.string.isRequired,
        onEditButtonClick: PropTypes.func.isRequired,
        onCrossButtonClick: PropTypes.func.isRequired,
        onAddPageToList: PropTypes.func.isRequired,
    }

    constructor(props) {
        super(props)
        this.state = {
            isMouseInside: false,
        }
    }

    mouseEnter = () => {
        this.setState({
            isMouseInside: true,
        })
    }

    mouseLeave = () => {
        this.setState({
            isMouseInside: false,
        })
    }

    // There is this wierd bug in chrome that won't fire onDrop until
    // on Drag over is handled.
    // https://bugs.chromium.org/p/chromium/issues/detail?id=168387
    handleDragOver = event => {
        event.preventDefault()
    }

    handleDrop = event => {
        event.preventDefault()
        // Gets the URL of the dropped list item
        const url = event.dataTransfer.getData('URL')
        console.log(url, event)
        this.props.onAddPageToList(url)
    }

    render() {
        return (
            <div
                onMouseEnter={this.mouseEnter}
                onMouseLeave={this.mouseLeave}
                className={styles.pageList}
                onDragOver={this.handleDragOver}
                onDrop={this.handleDrop}
                title={this.props.listName}
            >
                {this.state.isMouseInside ? (
                    <button
                        className={cx(styles.editButton, styles.button)}
                        onClick={this.props.onEditButtonClick}
                    />
                ) : null}
                <div className={styles.listName}>{this.props.listName}</div>
                {this.state.isMouseInside ? (
                    <button
                        className={cx(styles.deleteButton, styles.button)}
                        onClick={this.props.onCrossButtonClick}
                    />
                ) : null}
            </div>
        )
    }
}

export default PageList
