import React from 'react'
import PropTypes from 'prop-types'
import { IMPORT_TYPE as TYPE } from '../constants'
import { Checkbox } from 'src/common-ui/components'
import styled from 'styled-components'

import Concurrency from './Concurrency'
import PrevFailedCheckbox from './PrevFailedCheckbox'

import styles from './AdvSettings.css'

const AdvSettings = ({ onPrevFailedToggle, prevFailedValue, ...props }) => (
    <Container>
        <SectionTitleSmall>Import Settings</SectionTitleSmall>
        <div className={styles.advFunctionality}>
            <ul className={styles.settingsList}>
                <SettingsListItem>
                    <Checkbox
                        id="index-imports"
                        handleChange={props.onIndexTitleToggle}
                        isChecked={props.indexTitle}
                    >
                        <Label>
                            <LabelMain htmlFor="index-imports">
                                Only import title, urls and metadata
                            </LabelMain>
                            <SubLabel htmlFor="index-imports">
                                This setting skips the full-text indexing.
                            </SubLabel>
                        </Label>
                    </Checkbox>
                </SettingsListItem>
                <SettingsListItem>
                    <PrevFailedCheckbox
                        checked={prevFailedValue}
                        onChange={onPrevFailedToggle}
                    />
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
    border-top: 1px solid ${(props) => props.theme.colors.lineGrey};
    padding-top: 20px;
`

const SettingsListItem = styled.div`
    display: grid;
    grid-gap: 18px;
    grid-auto-flow: column;
    align-items: center;
    justify-content: flex-start;
    height: 60px;
`

const Label = styled.div`
    display: grid;
    grid-gap: 5px;
    grid-auto-flow: row;
    align-items: flex-start;
    justify-content: center;
`

const LabelMain = styled.div`
    font-size: 14px;
    font-weight: 500;
    color: ${(props) => props.theme.colors.darkerText};
`

const SubLabel = styled.div`
    color: ${(props) => props.theme.colors.lighterText};
    font-size: 14px;
`

const SectionTitleSmall = styled.div`
    color: ${(props) => props.theme.colors.darkerText};
    font-size: 18px;
    font-weight: bold;
    margin-bottom: 10px;
`

export default AdvSettings
