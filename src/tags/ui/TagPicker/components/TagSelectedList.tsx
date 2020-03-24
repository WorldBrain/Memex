import React, { ChangeEvent } from 'react'
import { ActiveTab } from 'src/tags/ui/TagPicker/components/ActiveTab'

interface Props {
    tagsSelected: string[]
    onPress: (tag: string) => void
}
export class TagSelectedList extends React.PureComponent<Props> {
    _getTagAttr = event => event.target.getAttribute('data-tag-name')

    handleSelectedTabPress = (event: ChangeEvent) =>
        this.props.onPress(this._getTagAttr(event))

    render() {
        return (
            <React.Fragment>
                {this.props.tagsSelected?.map(tag => (
                    <ActiveTab
                        onMouse
                        key={`ActiveTab-${tag}`}
                        data-tag-name={tag}
                        onClick={this.handleSelectedTabPress}
                    >
                        {tag}
                    </ActiveTab>
                ))}
            </React.Fragment>
        )
    }
}
