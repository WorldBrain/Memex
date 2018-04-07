import React, { PureComponent } from 'react'
import styles from './CommentDropdown.css'
class CommentDropdown extends PureComponent {
    state = {
        inputText: 'add new comment',
        isNew: true,
    }

    render() {
        const { inputText, isNew } = this.state
        return (
            <div className={styles.container}>
                <textarea rows="8" className={styles.textarea}>
                    {inputText}
                </textarea>
                <div className={styles.buttongroup}>
                    <button
                        onClick={this.toggleTagPopup}
                        disabled={this.isTagBtnDisabled}
                        className={styles.cancel}
                    >
                        cancel
                    </button>
                    <button
                        onClick={this.toggleTagPopup}
                        disabled={this.isTagBtnDisabled}
                        className={styles.add}
                    >
                        {isNew ? 'Add' : 'Update'}
                    </button>
                </div>
            </div>
        )
    }
}

export default CommentDropdown
