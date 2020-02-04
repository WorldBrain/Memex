import React, { PureComponent } from 'react'
import { Props } from './result-item'
import cx from 'classnames'
import ButtonTooltip from './button-tooltip'
import SemiCircularRibbon from './semi-circular-ribbon'


const styles = require('./result-item.css')

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
                            <img src="/img/trash.svg" className={cx(styles.img, styles.trash)}
                            />
                        </div>
                    </ButtonTooltip>
                     <ButtonTooltip
                        position="bottom"
                        tooltipText="Add/View Tags"
                    >
                        <div
                            className={styles.button}
                            onClick={this.props.onTagBtnClick}
                            ref={this.props.setTagButtonRef}
                        >
                            <img src="/img/tag.svg" className={cx(styles.img, styles.tag)}
                            />
                        </div>
                    </ButtonTooltip>
                    <ButtonTooltip
                        position="bottom"
                        tooltipText="Add/View Commments & Annotations"
                    >
                        <div
                            className={styles.permanentButton}
                            onClick={this.props.onCommentBtnClick}
                        >
                            {this.props.annotsCount < 1 ? (
                                    <img src="/img/comment_empty.svg" className={cx(styles.img, styles.comment)}/>
                                ):(
                                    <img src="/img/comment_full.svg" className={cx(styles.img, styles.commentActive)}/>
                            )}
                        </div>
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
                            <img src="/img/star_full.svg" className={cx(styles.img, styles.bookmark)}/>
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
                            <img src="/img/star_empty.svg" className={cx(styles.img, styles.notbookmark)}/>  
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
