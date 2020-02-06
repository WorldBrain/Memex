import React, { PureComponent } from 'react'
import { Props } from './result-item'
import cx from 'classnames'
import ButtonTooltip from './button-tooltip'
import SemiCircularRibbon from './semi-circular-ribbon'
import { browser } from 'webextension-polyfill-ts'


const styles = require('./result-item.css')
const tagEmpty = browser.extension.getURL('/img/tag_empty_results.svg')
const tagFull = browser.extension.getURL('/img/tag_full_results.svg')
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
                    <ButtonTooltip
                        position="bottom"
                        tooltipText="Delete this page & all related content"
                    >
                        <div
                            className={styles.button}
                            onClick={this.props.onTrashBtnClick}
                        >
                            <img src={deleteItem} className={cx(styles.img, styles.trash)}
                            />
                        </div>
                    </ButtonTooltip>
                    {!this.props.tagManager ? (
                        this.props.tags.length > 0 ? (
                            <ButtonTooltip
                                position="bottom"
                                tooltipText="Add/View Tags"
                            >
                                <div
                                    className={styles.permanentButton}
                                >
                                    <img src={tagFull} onClick={this.props.onTagBtnClick}
                                    ref={this.props.setTagButtonRef} className={cx(styles.img, styles.tag)}
                                    />
                                </div>
                            </ButtonTooltip> 
                            ):(
                                 <ButtonTooltip
                                    position="bottom"
                                    tooltipText="Add/View Tags"
                                >
                                    <div
                                        className={styles.button}
                                    >
                                        <img src={tagEmpty} onClick={this.props.onTagBtnClick}
                                        ref={this.props.setTagButtonRef} className={cx(styles.img, styles.tag)}
                                        />
                                    </div>
                                </ButtonTooltip> 
                            )) : (                   
                            <ButtonTooltip
                                position="bottom"
                                tooltipText="Add/View Tags"
                            >
                                <div
                                    className={styles.permanentButton}
                                >
                                    <img src={tagFull} onClick={this.props.onTagBtnClick}
                                    ref={this.props.setTagButtonRef} className={cx(styles.img, styles.commentActive)}
                                    />
                                </div>
                            </ButtonTooltip>
                        )}
                    <ButtonTooltip
                        position="bottom"
                        tooltipText="Add/View Commments & Annotations"
                    >
                        {this.props.annotsCount > 0 ? (
                        <div
                            className={styles.permanentButton}
                            onClick={this.props.onCommentBtnClick}
                        >
                            <img src={commentFull} className={cx(styles.img, styles.commentActive)}/>
                        </div>
                        ):(
                           <div
                            className={styles.button}
                            onClick={this.props.onCommentBtnClick}
                            >
                               <img src={commentEmpty} className={cx(styles.img, styles.comment)}/>
                           </div>
                        )}
                    </ButtonTooltip>
                    {this.props.hasBookmark ? (
                    <ButtonTooltip
                        position="bottom"
                        tooltipText="Bookmark"
                    >
                        <div
                            className={styles.permanentButton}
                            onClick={this.props.onToggleBookmarkClick}
                        >        
                            <img src={heartFull} className={cx(styles.img, styles.bookmark)}/>
                        </div>
                    </ButtonTooltip>) :
                    (
                        <ButtonTooltip
                        position="bottom"
                        tooltipText="Bookmark"
                        >
                        <div
                            className={styles.button}
                            onClick={this.props.onToggleBookmarkClick}
                        >        
                            <img src={heartEmpty} className={cx(styles.img, styles.notbookmark)}/>  
                            </div>
                        </ButtonTooltip>
                    )}
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
