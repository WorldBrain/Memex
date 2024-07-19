export async function captureScreenshotFromHTMLVideo(screenshotTarget) {
    let canvas = document.createElement('canvas')
    let height = screenshotTarget.offsetHeight
    let width = screenshotTarget.offsetWidth

    canvas.width = width
    canvas.height = height

    let ctx = canvas.getContext('2d')

    ctx.drawImage(screenshotTarget, 0, 0, canvas.width, canvas.height)

    let image = canvas.toDataURL('image/jpeg')

    return image
}
