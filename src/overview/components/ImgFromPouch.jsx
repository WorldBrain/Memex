import get from 'lodash/fp/get'
import omit from 'lodash/fp/omit'
import { blobToBase64String } from 'blob-util'
import React from 'react'
import PropTypes from 'prop-types'

import db from 'src/pouchdb'


const readHash = ({doc, attachmentId}) =>
    doc && attachmentId && get(['_attachments', attachmentId, 'digest'])(doc)

async function getAttachment({doc, attachmentId}) {
    if (!doc
        || !attachmentId
        || readHash({doc, attachmentId}) === undefined
    ) {
        return undefined
    }
    const blob = await db.getAttachment(doc._id, attachmentId)
    const base64 = await blobToBase64String(blob)
    const dataUri = `data:${blob.type};base64,${base64}`
    return dataUri
}

export default class ImgFromPouch extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            dataUri: undefined,
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
        const dataUri = await getAttachment({doc, attachmentId})
        if (this._isMounted) {
            this.setState({dataUri})
        }
    }

    render() {
        const childProps = omit(Object.keys(this.constructor.propTypes))(this.props)
        return (
            <img
                {...childProps}
                src={this.state.dataUri}
            />
        )
    }
}

ImgFromPouch.propTypes = {
    doc: PropTypes.object,
    attachmentId: PropTypes.string,
}
