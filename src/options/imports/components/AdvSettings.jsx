import React from 'react'
import PropTypes from 'prop-types'
import { IMPORT_TYPE as TYPE } from '../constants'
import Checkbox from 'src/common-ui/components/Checkbox'
import styled from 'styled-components'

import Concurrency from './Concurrency'

import styles from './AdvSettings.css'

const AdvSettings = ({ onPrevFailedToggle, prevFailedValue, ...props }) => (
    <Container>
        <SectionTitleSmall>Import Settings</SectionTitleSmall>
        <div className={styles.advFunctionality}>
            <ul className={styles.settingsList}>
                <SettingsListItem onClick={() => props.onIndexTitleToggle()}>
                    <Checkbox
                        id="index-imports"
                        handleChange={props.onIndexTitleToggle}
                        isChecked={props.indexTitle}
                        label={'Only import title, urls and metadata'}
                        subLabel={'This setting skips the full-text indexing.'}
                    />
                </SettingsListItem>
                <SettingsListItem onClick={() => onPrevFailedToggle}>
                    <Checkbox
                        id="process-failed"
                        // handleChange={onPrevFailedToggle}
                        isChecked={prevFailedValue}
                        label={'Include previously failed urls'}
                        subLabel={
                            'Retry also urls that have previously been unsuccessful'
                        }
                    />
                    {/* <PrevFailedCheckbox
                        checked={prevFailedValue}
                        onChange={onPrevFailedToggle}
                    /> */}
                </SettingsListItem>
                <SettingsListItem>
                    <Concurrency {...props} />
                </SettingsListItem>
            </ul>
        </div>
    </Container>
)

AdvSettings.propTypes = {
    allowTypes: PropTypes.shape({
        [TYPE.HISTORY]: PropTypes.bool.isRequired,
        [TYPE.BOOKMARK]: PropTypes.bool.isRequired,
        [TYPE.OTHERS]: PropTypes.string.isRequired,
    }).isRequired,
    indexTitle: PropTypes.bool.isRequired,
    onPrevFailedToggle: PropTypes.func.isRequired,
    prevFailedValue: PropTypes.bool.isRequired,
    onIndexTitleToggle: PropTypes.func.isRequired,
}

const Container = styled.div`
    margin-top: 24px;
    border-top: 1px solid ${(props) => props.theme.colors.greyScale2};
    padding-top: 20px;
`

const SettingsListItem = styled.div`
    display: grid;
    grid-gap: 18px;
    grid-auto-flow: column;
    align-items: center;
    justify-content: flex-start;
    height: 60px;
    width: fill-available;
    margin-left: -10px;
    padding: 10px;
    border-radius: 8px;
    width: fill-available;
    cursor: pointer;

    &:hover {
        outline: 1px solid ${(props) => props.theme.colors.greyScale3};
    }
`

const SectionTitleSmall = styled.div`
    color: ${(props) => props.theme.colors.greyScale6};
    font-size: 18px;
    font-weight: bold;
    margin-bottom: 10px;
`

export default AdvSettings
