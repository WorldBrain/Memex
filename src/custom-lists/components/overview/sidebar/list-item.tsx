import React, { Component, DragEventHandler } from 'react'
import cx from 'classnames'

const styles = require('./list-item.css')

interface Props {
    listName: string
    isFiltered: boolean
    onEditButtonClick: React.MouseEventHandler<HTMLButtonElement>
    onCrossButtonClick: React.MouseEventHandler<HTMLButtonElement>
    onAddPageToList: (url: string) => void
    onListItemClick: () => void
}

interface State {
    isMouseInside: boolean
    isDragInside: boolean
}

class PageList extends Component<Props, State> {
    private listItemRef: HTMLElement

    constructor(props) {
        super(props)
        this.state = {
            isMouseInside: false,
            isDragInside: false,
        }
    }

    componentDidMount() {
        this.attachEventListeners()
    }

    componentWillUnmount() {
        this.removeEventListeners()
    }

    private attachEventListeners() {
        this.listItemRef.addEventListener('mouseenter', this.handleMouseEnter)
        this.listItemRef.addEventListener('mouseleave', this.handleMouseLeave)
    }

    private removeEventListeners() {
        this.listItemRef.removeEventListener(
            'mouseenter',
            this.handleMouseEnter,
        )
        this.listItemRef.removeEventListener(
            'mouseleave',
            this.handleMouseLeave,
        )
    }

    private setListItemRef = (ref: HTMLElement) => {
        this.listItemRef = ref
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

    private handleMouseEnter = () => {
        this.setState(state => ({
            ...state,
            isMouseInside: true,
        }))
    }

    private handleMouseLeave = () => {
        this.setState(state => ({
            ...state,
            isMouseInside: false,
        }))
    }

    private handleDragEnter = () => {
        this.setState(state => ({
            ...state,
            isDragInside: true,
        }))
    }

    private handleDragOver = e => {
        e.preventDefault()
        this.setState(state => ({
            ...state,
            isDragInside: true,
        }))
    }

    private handleDragLeave = () => {
        this.setState(state => ({
            ...state,
            isDragInside: false,
        }))
    }

    private handleDrop: DragEventHandler = e => {
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

    private handleEditBtnClick: React.MouseEventHandler<
        HTMLButtonElement
    > = e => {
        e.stopPropagation()
        this.props.onEditButtonClick(e)
    }

    private handleCrossBtnClick: React.MouseEventHandler<
        HTMLButtonElement
    > = e => {
        e.stopPropagation()
        this.props.onCrossButtonClick(e)
    }

    render() {
        return (
            <div
                ref={this.setListItemRef}
                className={this.mainClass}
                onClick={this.props.onListItemClick}
                onDragOver={this.handleDragOver}
                onDrop={this.handleDrop}
                title={this.props.listName}
                onDragEnter={this.handleDragEnter}
                onDragLeave={this.handleDragLeave}
            >
                <div className={styles.listName}>{this.props.listName}</div>
                <div className={styles.buttonContainer}>
                    {this.state.isMouseInside && (
                        <React.Fragment>
                            <button
                                className={cx(styles.editButton, styles.button)}
                                onClick={this.handleEditBtnClick}
                            />
                            <button
                                className={cx(
                                    styles.deleteButton,
                                    styles.button,
                                )}
                                onClick={this.handleCrossBtnClick}
                            />
                        </React.Fragment>
                    )}
                </div>
            </div>
        )
    }
}

export default PageList
