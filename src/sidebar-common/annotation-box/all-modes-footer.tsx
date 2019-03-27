import * as React from 'react'

import { Footer } from '../components'
import DefaultFooter from './default-footer'

const styles = require('./all-modes-footer.css')

interface Props {
    mode: 'default' | 'edit' | 'delete'
    isEdited?: boolean
    timestamp?: string
    displayGoToAnnotation?: boolean
    handleGoToAnnotation?: (e: React.MouseEvent<HTMLElement>) => void
    handleEditAnnotation?: () => void
    handleDeleteAnnotation?: () => void
    handleCancelEdit?: () => void
    handleCancelDeletion?: () => void
    editIconClickHandler?: () => void
    trashIconClickHandler?: () => void
}

/* tslint:disable-next-line variable-name */
const AllModesFooter = (props: Props) => (
    <div className={styles.annotationBoxFooter}>
        {props.mode === 'edit' ? (
            <Footer
                actionBtnClassName={styles.footerBoldText}
                actionBtnClickHandler={props.handleEditAnnotation}
                actionBtnText="Save"
                cancelBtnClassName={styles.footerText}
                cancelBtnClickHandler={props.handleCancelEdit}
            />
        ) : props.mode === 'delete' ? (
            <Footer
                actionBtnClassName={styles.footerBoldText}
                actionBtnClickHandler={props.handleDeleteAnnotation}
                actionBtnText="Delete"
                cancelBtnClassName={styles.footerText}
                cancelBtnClickHandler={props.handleCancelDeletion}
                dialogText="Really?"
                dialogTextClassName={styles.deleteReally}
            />
        ) : (
            <DefaultFooter
                isEdited={props.isEdited}
                timestamp={props.timestamp}
                displayGoToAnnotation={props.displayGoToAnnotation}
                goToAnnotationHandler={props.handleGoToAnnotation}
                editIconClickHandler={props.editIconClickHandler}
                trashIconClickHandler={props.trashIconClickHandler}
            />
        )}
    </div>
)

export default AllModesFooter
