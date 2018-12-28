import * as React from 'react'

import { ClickHandler } from '../../types'
import * as constants from '../constants'

const styles = require('./comment-box-form.css')

interface Props {
    onSave: (...args: any[]) => void
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

    state = {
        rows: constants.NUM_DEFAULT_ROWS,
        value: '',
    }

    componentDidMount() {
        // TODO: Use `rows` while resizing instead of directly manipulating height.

        // Auto resize text area.
        if (this._textAreaRef) {
            this._textAreaRef.addEventListener('scroll', (e: UIEvent) => {
                const targetElement = e.target as HTMLElement

                // i prevents infinity loop when resizing
                for (let i = 0; targetElement.scrollTop && i < 30; ++i) {
                    // For dynamically getting the height even if resized
                    const height = window.getComputedStyle(targetElement).height
                    targetElement.style.height =
                        parseInt(height, 10) + 20 + 'px'
                }

                this._textAreaRef.focus()
            })
        }
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
        if (e.metaKey && e.key === 'Enter') {
            // this.props.handleSubmit(e)
        }
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

    render() {
        const { onSave, placeholder, handleCancelBtnClick } = this.props
        const { rows, value } = this.state

        return (
            <form
                onSubmit={e => {
                    e.preventDefault()
                    e.stopPropagation()
                }}
                className={styles.commentBoxForm}
            >
                {/* Text area to get the actual comment. */}
                <textarea
                    rows={rows}
                    className={styles.textArea}
                    value={value}
                    placeholder={placeholder ? placeholder : ''}
                    onChange={this._handleChange}
                    onKeyDown={this._handleKeyDown}
                    ref={this._setTextAreaRef}
                />
                <br />

                {/* Tags for the current annotation/comment. */}
                {this._renderTagInput()}

                {/* Save and Cancel buttons. */}
                <div className={styles.buttonHolder}>
                    <button className={styles.saveBtn} type="submit">
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
