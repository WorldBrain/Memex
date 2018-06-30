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
        isFiltered: PropTypes.bool.isRequired,
        onListItemClick: PropTypes.func.isRequired,
    }

    constructor(props) {
        super(props)
        this.state = {
            isMouseInside: false,
            isDragInside: false,
        }
    }

    get mainClass() {
        return cx(
            styles.pageList,
            {
                [styles.pageListDrag]: this.state.isDragInside,
            },
            {
                [styles.filtered]: this.props.isFiltered,
            },
        )
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

    handleDragEnter = () => {
        this.setState({
            isDragInside: true,
        })
    }

    handleDragOver = e => {
        e.preventDefault()
        this.setState({
            isDragInside: true,
        })
    }

    handleDragLeave = () => {
        // setTimeout(
        this.setState({
            isDragInside: false,
        })
        // , 500)
    }

    handleDrop = event => {
        event.preventDefault()
        this.setState({
            isDragInside: false,
        })
        // const url = event.dataTransfer.getData('URL')
        // Gets the URL of the dropped list item
        const data = event.dataTransfer.getData('text/plain')
        this.props.onAddPageToList(data.split(','))
    }

    render() {
        return (
            <div
                onMouseEnter={this.mouseEnter}
                onMouseLeave={this.mouseLeave}
                className={this.mainClass}
                onDragOver={this.handleDragOver}
                onDrop={this.handleDrop}
                title={this.props.listName}
                onDragEnter={this.handleDragEnter}
                onDragLeave={this.handleDragLeave}
            >
                {this.state.isMouseInside ? (
                    <button
                        className={cx(styles.editButton, styles.button)}
                        onClick={this.props.onEditButtonClick}
                    />
                ) : null}
                <div
                    onClick={this.props.onListItemClick}
                    className={styles.listName}
                >
                    {this.props.listName}
                </div>
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
