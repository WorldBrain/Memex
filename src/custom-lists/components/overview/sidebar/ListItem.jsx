import React, { Component } from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'

import styles from './ListItem.css'
// import { urlDragged } from '../../../selectors';

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
        this.setState(state => ({
            ...state,
            isMouseInside: true,
        }))
    }

    mouseLeave = () => {
        this.setState(state => ({
            ...state,
            isMouseInside: false,
        }))
    }

    handleDragEnter = () => {
        this.setState(state => ({
            ...state,
            isDragInside: true,
        }))
    }

    handleDragOver = e => {
        e.preventDefault()
        this.setState(state => ({
            ...state,
            isDragInside: true,
        }))
    }

    handleDragLeave = () => {
        this.setState(state => ({
            ...state,
            isDragInside: false,
        }))
    }

    handleDrop = e => {
        e.preventDefault()
        this.setState(state => ({
            ...state,
            isDragInside: false,
        }))
        // const url = e.dataTransfer.getData('URL')
        // Gets the URL of the dropped list item
        const url = e.dataTransfer.getData('text/plain')
        // this.props.resetUrlDragged()
        this.props.onAddPageToList(url)
    }

    handleEditBtnClick = e => {
        e.stopPropagation()
        this.props.onEditButtonClick(e)
    }

    handleCrossBtnClick = e => {
        e.stopPropagation()
        this.props.onCrossButtonClick(e)
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
                onClick={this.props.onListItemClick}
            >
                <div className={styles.listName}>{this.props.listName}</div>
                <div className={styles.buttonContainer}>
                    {this.state.isMouseInside ? (
                        <button
                            className={cx(styles.editButton, styles.button)}
                            onClick={this.handleEditBtnClick}
                        />
                    ) : null}
                    {this.state.isMouseInside ? (
                        <button
                            className={cx(styles.deleteButton, styles.button)}
                            onClick={this.handleCrossBtnClick}
                        />
                    ) : null}
                    {this.state.isMouseInside ? (
                        <button
                            className={cx(styles.shareButton, styles.button)}
                            onClick={() => null}
                        />
                    ) : null}
                </div>
            </div>
        )
    }
}

export default PageList
