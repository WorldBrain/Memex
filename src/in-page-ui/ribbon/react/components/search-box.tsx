import * as React from 'react'
import onClickOutside from 'react-onclickoutside'

import TextInputControlled from 'src/common-ui/components/TextInputControlled'
import { RibbonSearchProps } from './types'

const styles = require('./ribbon.css')

export interface Props extends RibbonSearchProps {
    onSearchEnterPress: React.KeyboardEventHandler
    onOutsideClick: () => void
}

class SearchBox extends React.Component<Props> {
    handleClickOutside() {
        this.props.onOutsideClick()
    }

    render() {
        return (
            <form>
                <span className={styles.search} />
                <TextInputControlled
                    autoFocus
                    className={styles.searchInput}
                    type="input"
                    name="query"
                    placeholder="Search your Memex"
                    autoComplete="off"
                    onChange={this.props.setSearchValue}
                    specialHandlers={[
                        {
                            test: (e) => e.key === 'Enter',
                            handle: this.props.onSearchEnterPress,
                        },
                    ]}
                    defaultValue={this.props.searchValue}
                />
            </form>
        )
    }
}

export default onClickOutside(SearchBox)
