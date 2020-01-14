import React from 'react'
import { ModalBox } from 'src/common-ui/components/design-library/ModalBox'
import { PrimaryAction } from 'src/common-ui/components/design-library/actions/PrimaryAction'
import { SecondaryAction } from 'src/common-ui/components/design-library/actions/SecondaryAction'

export const Introduction = ({
    handleStart,
    handleBack,
}: {
    handleStart: () => void
    handleBack: () => void
}) => {
    return (
        <ModalBox
            header={''}
            actions={[
                <SecondaryAction label={'back'} onClick={handleBack} />,
                <PrimaryAction label={'Start'} onClick={handleStart} />,
            ]}
        >
            <span>Introduction</span>
        </ModalBox>
    )
}
