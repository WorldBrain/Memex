import * as React from 'react'

import { ClickHandler } from '../../types'
import * as constants from '../constants'

const styles = require('./comment-box-form.css')

interface Props {
    handleSubmit: ClickHandler<HTMLFormElement>
    handleCancelBtnClick: ClickHandler<HTMLElement>
    placeholder?: string
}

interface State {
    rows: number
    value: string
}

class CommentBoxForm extends React.Component<Props, State> {
    private _textAreaRef: HTMLElement
    private _tagRef: HTMLElement
    private _saveBtnRef: HTMLElement

    state = {
        rows: constants.NUM_DEFAULT_ROWS,
        value: '',
    }

    private _handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        let rows: number
        const comment = e.target.value

        if (comment.length === 0) {
            rows = constants.NUM_DEFAULT_ROWS
            this._textAreaRef.style.height = ''
        } else {
            rows = constants.NUM_MAX_ROWS
        }

        this.setState({ value: comment, rows })
    }

    private _handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        // TODO: Implement a better logic to handle tabbing.
        // if (e.key === 'Tab') {
        //     e.preventDefault()
        //     e.stopPropagation()
        //     this.props.setTagInput(true)
        // } else if (e.metaKey && e.key === 'Enter') {
        //     e.preventDefault()
        //     this.save()
        // }
    }

    private _renderTagInput() {
        // TODO: Implement a better logic to render tags.

        // const tagObjs = this.props.tags.map(tag => ({ name: tag }))

        // if (this.props.tagInput) {
        //     return (
        //         <IndexDropdown
        //             isForAnnotation
        //             allowAdd
        //             initFilters={this.props.tags}
        //             onFilterAdd={this.props.addTag}
        //             onFilterDel={this.props.deleteTag}
        //             source="tag"
        //         />
        //     )
        // } else {
        //     return (
        //         <TagHolder
        //             tags={tagObjs}
        //             clickHandler={() => this.props.setTagInput(true)}
        //             deleteTag={({ tag }) => this.props.deleteTag(tag)}
        //         />
        //     )
        // }

        return null
    }

    private _setTextAreaRef = (ref: HTMLElement) => {
        this._textAreaRef = ref
    }

    private _setTagRef = (ref: HTMLElement) => {
        this._tagRef = ref
    }

    private _setSaveRef = (ref: HTMLElement) => {
        this._saveBtnRef = ref
    }

    render() {
        const { handleSubmit, placeholder, handleCancelBtnClick } = this.props
        const { rows, value } = this.state

        return (
            <form onSubmit={handleSubmit} className={styles.commentBoxForm}>
                {/* Text area to get the actual comment. */}
                <textarea
                    rows={rows}
                    className={styles.textArea}
                    value={value}
                    // placeholder="Add your comment... (save with cmd/ctrl+enter)"
                    placeholder={placeholder ? placeholder : ''}
                    onChange={this._handleChange}
                    onKeyDown={this._handleKeyDown}
                    ref={this._setTextAreaRef}
                    // onClick={() => this.props.setTagInput(false)}
                />
                <br />

                {/* Tags for the current annotation/comment. */}
                <div ref={this._setTagRef}>{this._renderTagInput()}</div>

                {/* Save and Cancel buttons. */}
                <div className={styles.buttonHolder}>
                    <button
                        className={styles.saveBtn}
                        type="submit"
                        ref={this._setSaveRef}
                    >
                        Save
                    </button>
                    <button
                        className={styles.cancelBtn}
                        onClick={handleCancelBtnClick}
                    >
                        Cancel
                    </button>
                </div>
            </form>
        )
    }
}

export default CommentBoxForm
