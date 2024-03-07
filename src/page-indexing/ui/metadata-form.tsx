import React from 'react'
import type { PageIndexingInterface } from '../background/types'
import type { UITaskState } from '@worldbrain/memex-common/lib/main-ui/types'
import type {
    PageEntity,
    PageMetadata,
} from '@worldbrain/memex-common/lib/types/core-data-types/client'

export interface Props {
    pageIndexingBG: PageIndexingInterface<'caller'>
    normalizedPageUrl: string
    onCancel: () => void
    onSave: () => void
}

export interface State
    extends Required<Omit<PageMetadata, 'normalizedPageUrl'>> {
    entities: Omit<PageEntity, 'normalizedPageUrl'>[]
    loadState: UITaskState
    submitState: UITaskState
}

export class PageMetadataForm extends React.PureComponent<Props, State> {
    state: State = {
        doi: '',
        title: '',
        annotation: '',
        sourceName: '',
        journalName: '',
        journalPage: '',
        journalIssue: '',
        journalVolume: '',
        releaseDate: Date.now(),
        accessDate: Date.now(),
        entities: [],
        loadState: 'pristine',
        submitState: 'pristine',
    }

    async componentDidMount() {
        this.setState({ loadState: 'running' })

        let initAccessDate = Date.now() // TODO: Replace this with a call to get the oldest visit/bookmark for this page
        const metadata = (await this.props.pageIndexingBG.getPageMetadata({
            normalizedPageUrl: this.props.normalizedPageUrl,
        })) ?? { entities: [], accessDate: initAccessDate }

        this.setState((previousState) => ({
            doi: metadata.doi ?? previousState.doi,
            // TODO: Fill in
            accessDate: metadata.accessDate,
            entities: metadata.entities,
            loadState: 'success',
        }))
    }

    private handleSubmit: React.FormEventHandler = async (e) => {
        e.preventDefault()
        this.setState({ submitState: 'running' })

        await this.props.pageIndexingBG.updatePageMetadata({
            normalizedPageUrl: this.props.normalizedPageUrl,
            entities: this.state.entities,
            title: this.state.title,
            doi: this.state.doi,
            annotation: this.state.annotation,
            // TODO: Fill in
            sourceName: '',
            journalName: '',
            journalPage: '',
            journalIssue: '',
            journalVolume: '',
            releaseDate: 0,
            accessDate: 0,
        })
        this.setState({ submitState: 'success' })
        this.props.onSave()
    }

    private handleTextInputChange = (
        stateKey: string,
    ): React.ChangeEventHandler<HTMLInputElement> => (e) => {
        this.setState({ [stateKey]: e.target.value } as any)
    }

    render() {
        return (
            <form onSubmit={this.handleSubmit}>
                <label>
                    DOI:
                    <input
                        type="text"
                        value={this.state.doi}
                        onChange={this.handleTextInputChange('doi')}
                    />
                </label>
                <input
                    type="button"
                    value="Cancel"
                    onClick={(e) => {
                        e.preventDefault()
                        this.props.onCancel()
                    }}
                />
                <input type="submit" value="Save" />
            </form>
        )
    }
}
