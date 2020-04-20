import * as React from 'react'
import { connect, MapStateToProps } from 'react-redux'
import { IndexDropdown } from 'src/common-ui/containers'

interface DispatchProps {
    addTag: (tag: string) => void
    deleteTag: (tag: string) => void
}

interface OwnProps {
    env?: 'inpage' | 'overview'
    /* tags from local storage */
    tagSuggestions: string[]
    tags: string[]
    initTagSuggestions: string[]
}

export type TagsContainerProps = DispatchProps & OwnProps

/* tslint:disable-next-line variable-name */
const TagsContainer = (props: TagsContainerProps) => (
    <IndexDropdown
        env={props.env}
        isForAnnotation
        allowAdd
        initFilters={props.tags}
        initSuggestions={[
            ...new Set([...props.initTagSuggestions, ...props.tagSuggestions]),
        ]}
        onFilterAdd={props.addTag}
        onFilterDel={props.deleteTag}
        source="tag"
    />
)
export default TagsContainer
