import React, { PureComponent } from 'react'

import cx from 'classnames'

import { Props } from './result-item'
import ResultItemActionBtn from './result-item-action-btn'

const tagEmpty = chrome.runtime.getURL('/img/tag_empty.svg')
const tagFull = chrome.runtime.getURL('/img/tag_full.svg')
const listAdd = chrome.runtime.getURL('/img/collections_add.svg')
const listFull = chrome.runtime.getURL('/img/collections_full.svg')
const heartEmpty = chrome.runtime.getURL('/img/star_empty.svg')
const heartFull = chrome.runtime.getURL('/img/star_full.svg')
const commentEmpty = chrome.runtime.getURL('/img/comment_empty.svg')
const commentFull = chrome.runtime.getURL('/img/comment_full.svg')
const deleteItem = chrome.runtime.getURL('/img/trash.svg')
const copy = chrome.runtime.getURL('/img/copy.svg')

class ResultItemActions extends PureComponent<Omit<Props, 'goToAnnotation'>> {
    render() {
        const listLength = this.props.lists?.length ?? 0
        const tagsLength = this.props.tags?.length ?? 0

        return (
            <div>
                <div
                    onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                    }}
                >
                    <ResultItemActionBtn
                        imgSrc={deleteItem}
                        onClick={this.props.onTrashBtnClick}
                        tooltipText="Delete this page & all related content"
                    />
                    <ResultItemActionBtn
                        imgSrc={copy}
                        onClick={this.props.onCopyPasterBtnClick}
                        tooltipText="Copy"
                        refHandler={this.props.setCopyPasterButtonRef}
                    />
                    {/*<ResultItemActionBtn*/}
                    {/*    imgSrc={readerIcon}*/}
                    {/*    onClick={this.props.onReaderBtnClick}*/}
                    {/*    tooltipText="Open in reader view"*/}
                    {/*    className={styles.reader}*/}
                    {/*/>*/}
                    <ResultItemActionBtn
                        permanent={tagsLength > 0}
                        imgSrc={tagsLength > 0 ? tagFull : tagEmpty}
                        onClick={this.props.onTagBtnClick}
                        tooltipText="Edit Tags"
                        refHandler={this.props.setTagButtonRef}
                    />
                    <ResultItemActionBtn
                        permanent={listLength > 0}
                        imgSrc={listLength > 0 ? listFull : listAdd}
                        onClick={this.props.onListBtnClick}
                        tooltipText="Edit Spaces"
                        refHandler={this.props.setListButtonRef}
                    />
                    <ResultItemActionBtn
                        permanent={this.props.annotsCount > 0}
                        imgSrc={
                            this.props.annotsCount > 0
                                ? commentFull
                                : commentEmpty
                        }
                        onClick={this.props.onCommentBtnClick}
                        tooltipText="Add/View Notes"
                    />

                    <ResultItemActionBtn
                        permanent={this.props.hasBookmark}
                        imgSrc={this.props.hasBookmark ? heartFull : heartEmpty}
                        onClick={this.props.onToggleBookmarkClick}
                        tooltipText="Bookmark"
                    />
                </div>
            </div>
        )
    }
}

export default ResultItemActions
