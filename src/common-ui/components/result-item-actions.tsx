import React, { PureComponent } from 'react'
import { browser } from 'webextension-polyfill-ts'
import cx from 'classnames'

import { Props } from './result-item'
import SemiCircularRibbon from './semi-circular-ribbon'
import ResultItemActionBtn from './result-item-action-btn'

const styles = require('./result-item.css')
const tagEmpty = browser.extension.getURL('/img/tag_empty.svg')
const tagFull = browser.extension.getURL('/img/tag_full.svg')
const heartEmpty = browser.extension.getURL('/img/star_empty.svg')
const heartFull = browser.extension.getURL('/img/star_full.svg')
const commentEmpty = browser.extension.getURL('/img/comment_empty.svg')
const commentFull = browser.extension.getURL('/img/comment_full.svg')
const deleteItem = browser.extension.getURL('/img/trash.svg')

class ResultItemActions extends PureComponent<Props> {
    get bookmarkClass() {
        return cx(styles.button, {
            [styles.bookmark]: this.props.hasBookmark,
            [styles.notBookmark]: !this.props.hasBookmark,
        })
    }

    render() {
        return (
            <div
                className={cx(styles.detailsContainer, {
                    [styles.tweetDetailsContainer]: this.props.isSocial,
                })}
            >
                <div
                    className={styles.buttonsContainer}
                    onClick={e => {
                        e.preventDefault()
                        e.stopPropagation()
                    }}
                >
                    <ResultItemActionBtn
                        imgSrc={deleteItem}
                        onClick={this.props.onTrashBtnClick}
                        tooltipText="Delete this page & all related content"
                        className={styles.trash}
                    />
                    <ResultItemActionBtn
                        permanent={this.props.tags.length > 0}
                        imgSrc={this.props.tags.length > 0 ? tagFull : tagEmpty}
                        className={
                            this.props.tags.length > 0
                                ? styles.commentActive
                                : styles.tag
                        }
                        onClick={this.props.onTagBtnClick}
                        tooltipText="Add/View Notes"
                        refHandler={this.props.setTagButtonRef}
                    />
                    <ResultItemActionBtn
                        permanent={this.props.annotsCount > 0}
                        imgSrc={
                            this.props.annotsCount > 0
                                ? commentFull
                                : commentEmpty
                        }
                        className={
                            this.props.annotsCount > 0
                                ? styles.commentActive
                                : styles.comment
                        }
                        onClick={this.props.onCommentBtnClick}
                        tooltipText="Add/View Notes"
                    />

                    <ResultItemActionBtn
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
