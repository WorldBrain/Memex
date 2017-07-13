import get from 'lodash/fp/get'
import omit from 'lodash/fp/omit'
import React from 'react'
import PropTypes from 'prop-types'

import { getAttachmentAsDataUrl } from 'src/pouchdb'


const readHash = ({doc, attachmentId}) =>
    doc && attachmentId && get(['_attachments', attachmentId, 'digest'])(doc)

export default class ImgFromPouch extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            dataUrl: undefined,
        }
    }

    componentWillMount() {
        // Fetch the attachment. Note we will not have it on our first mount.
        this._isMounted = true
        this.updateFile(this.props)
    }

    componentWillReceiveProps(nextProps) {
        // If the attachment has changed, rerun the update
        if (readHash(nextProps) !== readHash(this.props)) {
            this.updateFile(nextProps)
        }
    }

    componentWillUnmount() {
        this._isMounted = false
    }

    async updateFile({doc, attachmentId}) {
        const dataUrl = await getAttachmentAsDataUrl({doc, attachmentId})
        if (this._isMounted) {
            this.setState({dataUrl})
        }
    }

    render() {
        const childProps = omit(Object.keys(this.constructor.propTypes))(this.props)
        return (
            <img
                {...childProps}
                src={this.state.dataUrl}
            />
        )
    }
}

ImgFromPouch.propTypes = {
    doc: PropTypes.object,
    attachmentId: PropTypes.string,
}
