import React, { Component, DragEventHandler } from 'react'
import cx from 'classnames'
import { withCurrentUser } from 'src/authentication/components/AuthConnector'
import { AuthContextInterface } from 'src/authentication/background/types'
import { UserPlan } from '@worldbrain/memex-common/lib/subscriptions/types'
import { ContentSharingInterface } from 'src/content-sharing/background/types'
import CustomListStorage from 'src/custom-lists/background/storage'

import analytics from 'src/analytics'
import { runInBackground } from 'src/util/webextensionRPC'

const styles = require('./list-item.css')

export interface Props extends AuthContextInterface {
    listName: string
    listId: number
    isFiltered?: boolean
    onShareButtonClick?: React.MouseEventHandler<HTMLButtonElement>
    onEditButtonClick: React.MouseEventHandler<HTMLButtonElement>
    onCrossButtonClick: React.MouseEventHandler<HTMLButtonElement>
    onAddPageToList: (url: string, isSocialPost: boolean) => void
    onListItemClick: () => void
    plans?: UserPlan[]
    contentSharing: ContentSharingInterface
    customLists: CustomListStorage
}

interface State {
    isMouseInside: boolean
    isDragInside: boolean
    isShared: boolean
}

class ListItem extends Component<Props, State> {
    private listItemRef: HTMLElement

    constructor(props) {
        super(props)
        this.state = {
            isMouseInside: false,
            isDragInside: false,
            isShared: false,
        }
    }

    async componentDidMount() {
        this.attachEventListeners()
        this.getSharedState()
    }

    componentWillUnmount() {
        this.removeEventListeners()
    }

    async getSharedState() {
        const contentSharing = runInBackground<ContentSharingInterface>()
        const remoteId = await contentSharing.getRemoteListId({
            localListId: this.props.listId,
        })
        this.setState({ isShared: !!remoteId })
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
        this.setState((state) => ({
            isMouseInside: true,
        }))
    }

    private handleMouseLeave = () => {
        this.setState((state) => ({
            isMouseInside: false,
        }))
    }

    private handleDragOver = (e) => {
        e.preventDefault()
        this.setState((state) => ({
            isDragInside: true,
        }))
    }

    private handleDragLeave = () => {
        this.setState((state) => ({
            isDragInside: false,
        }))
    }

    private handleDrop: DragEventHandler = (e) => {
        e.preventDefault()
        this.handleDragLeave()
        // const url = e.dataTransfer.getData('URL')
        // Gets the URL of the dropped list item
        const { url, isSocialPost } = JSON.parse(
            e.dataTransfer.getData('text/plain'),
        )

        analytics.trackEvent({
            category: 'Collections',
            action: 'addPageViaDragAndDrop',
        })

        // this.props.resetUrlDragged()
        this.props.onAddPageToList(url, isSocialPost)
    }

    private handleShareBtnClick: React.MouseEventHandler<HTMLButtonElement> = (
        e,
    ) => {
        e.stopPropagation()
        this.props.onShareButtonClick?.(e)
    }

    private handleEditBtnClick: React.MouseEventHandler<HTMLButtonElement> = (
        e,
    ) => {
        e.stopPropagation()
        this.props.onEditButtonClick(e)
    }

    private handleCrossBtnClick: React.MouseEventHandler<HTMLButtonElement> = (
        e,
    ) => {
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
                onDragEnter={this.handleDragOver}
                onDragLeave={this.handleDragLeave}
            >
                <div className={styles.listName}>{this.props.listName}</div>
                <div className={styles.buttonContainer}>
                    {this.state.isMouseInside && (
                        <React.Fragment>
                            <button
                                className={cx(styles.editButton, styles.button)}
                                onClick={this.handleEditBtnClick}
                                title={'Edit'}
                            />
                            <button
                                className={cx(
                                    styles.deleteButton,
                                    styles.button,
                                )}
                                onClick={this.handleCrossBtnClick}
                                title={'Delete'}
                            />
                            {!this.state.isShared && (
                                <button
                                    className={cx(
                                        styles.shareButton,
                                        styles.button,
                                    )}
                                    onClick={this.handleShareBtnClick}
                                    title={'Share'}
                                />
                            )}
                        </React.Fragment>
                    )}
                    {this.state.isShared && (
                        <button
                            className={cx(
                                styles.shareButton,
                                styles.button,
                                {
                                    [styles.shareButtonPermanent]: this.state
                                        .isShared,
                                },
                                {
                                    [styles.shareButtonPermanentHover]: this
                                        .state.isMouseInside,
                                },
                            )}
                            onClick={this.handleShareBtnClick}
                            title={'Shared'}
                        />
                    )}
                </div>
            </div>
        )
    }
}

export default withCurrentUser(ListItem)
