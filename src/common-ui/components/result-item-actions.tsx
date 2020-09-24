import React, { PureComponent } from 'react'
import { browser } from 'webextension-polyfill-ts'
import cx from 'classnames'

import { Props } from './result-item'
import SemiCircularRibbon from './semi-circular-ribbon'
import ResultItemActionBtn from './result-item-action-btn'

const styles = require('./result-item.css')
const tagEmpty = browser.extension.getURL('/img/tag_empty.svg')
const tagFull = browser.extension.getURL('/img/tag_full.svg')
const listAdd = browser.extension.getURL('/img/collections_add.svg')
const listFull = browser.extension.getURL('/img/collections_full.svg')
const heartEmpty = browser.extension.getURL('/img/star_empty.svg')
const heartFull = browser.extension.getURL('/img/star_full.svg')
const commentEmpty = browser.extension.getURL('/img/comment_empty.svg')
const commentFull = browser.extension.getURL('/img/comment_full.svg')
const deleteItem = browser.extension.getURL('/img/trash.svg')
const copy = browser.extension.getURL('/img/copy.svg')
const readerIcon = browser.extension.getURL('/img/reader.svg')

class ResultItemActions extends PureComponent<Omit<Props, 'goToAnnotation'>> {
    get bookmarkClass() {
        return cx(styles.button, {
            [styles.bookmark]: this.props.hasBookmark,
            [styles.notBookmark]: !this.props.hasBookmark,
        })
    }

    render() {
        const listLength = this.props.lists?.length ?? 0
        const tagsLength = this.props.tags?.length ?? 0

        return (
            <div
                className={cx(styles.detailsContainer, {
                    [styles.tweetDetailsContainer]: this.props.isSocial,
                })}
            >
                <div
                    className={styles.buttonsContainer}
                    onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                    }}
                >
                    <ResultItemActionBtn
                        imgSrc={copy}
                        onClick={this.props.onCopyPasterBtnClick}
                        tooltipText="Copy"
                        className={styles.copy}
                        refHandler={this.props.setCopyPasterButtonRef}
                    />

                    {/*<ResultItemActionBtn*/}
                    {/*    imgSrc={readerIcon}*/}
                    {/*    onClick={this.props.onReaderBtnClick}*/}
                    {/*    tooltipText="Open in reader view"*/}
                    {/*    className={styles.reader}*/}
                    {/*/>*/}
                    <ResultItemActionBtn
                        imgSrc={deleteItem}
                        onClick={this.props.onTrashBtnClick}
                        tooltipText="Delete this page & all related content"
                        className={styles.trash}
                    />
                    <ResultItemActionBtn
                        permanent={tagsLength > 0}
                        imgSrc={tagsLength > 0 ? tagFull : tagEmpty}
                        className={
                            tagsLength > 0 ? styles.commentActive : styles.tag
                        }
                        onClick={this.props.onTagBtnClick}
                        tooltipText="Edit Tags"
                        refHandler={this.props.setTagButtonRef}
                    />
                    <ResultItemActionBtn
                        permanent={listLength > 0}
                        imgSrc={listLength > 0 ? listFull : listAdd}
                        className={
                            listLength > 0 ? styles.commentActive : styles.tag
                        }
                        onClick={this.props.onListBtnClick}
                        tooltipText="Edit Collections"
                        refHandler={this.props.setListButtonRef}
                    />
                    <ResultItemActionBtn
                        permanent={this.props.annotsCount > 0}
                        imgSrc={
                            this.props.annotsCount > 0
                                ? commentFull
                                : commentEmpty
                        }
                        className={cx(styles.commentBtn, {
                            [styles.comment]: this.props.annotsCount === 0,
                            [styles.commentActive]: this.props.annotsCount > 0,
                        })}
                        onClick={this.props.onCommentBtnClick}
                        tooltipText="Add/View Notes"
                    />

                    {/*<ResultItemActionBtn
                            permanent={this.props.hasBookmark}
                            imgSrc={this.props.hasBookmark ? heartFull : heartEmpty}
                            className={
                                this.props.hasBookmark
                                    ? styles.bookmark
                                    : styles.notBookmark
                            }
                            onClick={this.props.onToggleBookmarkClick}
                            tooltipText="Bookmark"
                        />
                    */}
                    {this.props.isListFilterActive && (
                        <SemiCircularRibbon
                            onClick={this.props.handleCrossRibbonClick}
                        />
                    )}
                </div>
            </div>
        )
    }
}

export default ResultItemActions
