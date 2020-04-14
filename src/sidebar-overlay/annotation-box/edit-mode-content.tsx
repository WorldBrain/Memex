import * as React from 'react'

import { TagInput } from '../components'
import AllModesFooter from './all-modes-footer'
import * as constants from '../comment-box/constants'
import { getLocalStorage } from 'src/util/storage'
import { TAG_SUGGESTIONS_KEY } from 'src/constants'
import TextInputControlled from 'src/common-ui/components/TextInputControlled'
import { Hover } from 'src/common-ui/components/design-library/Hover'

const styles = require('./edit-mode-content.css')

interface Props {
    env?: 'inpage' | 'overview'
    comment?: string
    handleCancelOperation: () => void
    handleEditAnnotation: (commentText: string) => void
}

interface State {
    commentText: string
    rows: number
}

class EditModeContent extends React.Component<Props, State> {
    state = {
        commentText: this.props.comment ? this.props.comment : '',
        rows: constants.NUM_DEFAULT_ROWS,
    }

    private _handleEditAnnotation = () => {
        const { commentText } = this.state
        this.props.handleEditAnnotation(commentText)
    }

    private onEnterSaveHandler = {
        test: e => (e.ctrlKey || e.metaKey) && e.key === 'Enter',
        handle: e => this.props.handleEditAnnotation(this.state.commentText),
    }

    private _handleCommentChange = commentText => {
        this.setState({ commentText })
    }

    render() {
        return (
            <React.Fragment>
                <TextInputControlled
                    defaultValue={this.state.commentText}
                    className={styles.textArea}
                    placeholder="Add a private note... (save with cmd/ctrl+enter)"
                    onChange={this._handleCommentChange}
                    specialHandlers={[this.onEnterSaveHandler]}
                />

                <AllModesFooter
                    mode="edit"
                    handleCancelEdit={this.props.handleCancelOperation}
                    handleEditAnnotation={this._handleEditAnnotation}
                />
            </React.Fragment>
        )
    }
}

export default EditModeContent
