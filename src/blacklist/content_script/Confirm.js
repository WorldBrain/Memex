export const overlayId = 'worldbrain-modal-overlay'
export const confirmBtnId = 'worldbrain-modal-confirm'
export const cancelBtnId = 'worldbrain-modal-cancel'

const overlayStyles = `
    display: flex !important;
    flex-direction: column !important;
    justify-content: center !important;
    align-items: center !important;
    position: fixed !important;
    top: 0 !important;
    bottom: 0 !important;
    left: 0 !important;
    right: 0 !important;
    z-index: 100000 !important;
`

const modalStyles = `
    display: flex !important;
    flex-direction: column !important;
    justify-content: space-around !important;
    align-items: center !important;
    font-size: 14px !important;
    color: #000 !important;
    min-hegiht: 100px !important;
    position: relative !important;
    padding: 20px !important;
    border-radius: 5px !important;
    border: 1px solid #e5e5e5 !important;
    width: 400px !important;
    height: 130px !important;
    background: #fff !important;
`

const btnBarStyles = `
    display: flex !important;
    justify-content: space-around !important;
    width: 100% !important;
`

const btnStyles = (confirm = false) => `
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    height: 25px !important;
    width: 75px !important;
    cursor: pointer !important;
    font-size: 1.2em !important;
    font-weight: 500 !important;
    border-radius: none !important;
    ${confirm ? 'color: #f44336 !important;' : 'color: #000 !important;'}
`

const createEl = ({ elType = 'div', id, style, innerText }) => {
    const el = document.createElement(elType)
    if (id) el.id = id
    if (style) el.style = style
    if (innerText) el.innerText = innerText
    return el
}

/**
 * Plain confirm modal affording confirm and cancel actions.
 * @param {any} props Props affording `text` to be shown, and `onConfirm` + `onCancel` callbacks to be bound to buttons.
 * @return {Element} The created modal overlay that can be mounted in the DOM.
 */
const ConfirmModal = ({ text, confirmText, cancelText, onConfirm, onCancel }) => {
    // Create all needed elements
    const overlay = createEl({ id: overlayId, style: overlayStyles })
    const modal = createEl({ style: modalStyles, innerText: text })
    const btnBar = createEl({ style: btnBarStyles })
    const confirmBtn = createEl({
        id: confirmBtnId,
        innerText: confirmText,
        style: btnStyles(true),
    })
    const cancelBtn = createEl({
        id: cancelBtnId,
        innerText: cancelText,
        style: btnStyles(),
    })

    // Add btn event listeners
    confirmBtn.addEventListener('click', onConfirm)
    cancelBtn.addEventListener('click', onCancel)

    // Attach all elements
    btnBar.appendChild(confirmBtn)
    btnBar.appendChild(cancelBtn)
    modal.appendChild(btnBar)
    overlay.appendChild(modal)

    return overlay
}

export default ConfirmModal
