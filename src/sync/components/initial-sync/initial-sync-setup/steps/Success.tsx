import React from 'react'
import { ModalBox } from 'src/common-ui/components/design-library/ModalBox'
import { PrimaryAction } from 'src/common-ui/components/design-library/actions/PrimaryAction'

export const Success = ({ onClose }: { onClose: () => void }) => {
    return (
        <ModalBox
            header={''}
            actions={[<PrimaryAction label={'Done'} onClick={onClose} />]}
        >
            <span>Success</span>
        </ModalBox>
    )
}
