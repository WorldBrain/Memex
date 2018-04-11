export default function copyUrl(url) {
    event.preventDefault()
    const dummy = document.createElement('input')
    document.body.appendChild(dummy)
    dummy.value = url
    dummy.select()
    document.execCommand('copy')
    document.body.removeChild(dummy)
}
