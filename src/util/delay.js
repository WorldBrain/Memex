export default function delay(t) {
    return new Promise(resolve => window.setTimeout(resolve, t))
}
