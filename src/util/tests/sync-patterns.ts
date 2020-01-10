import combinatorics from 'js-combinatorics'

export function* generateSyncPatterns<DeviceID>(
    devices: Array<DeviceID>,
    stepCount: number,
): Iterable<DeviceID[]> {
    const patterns = combinatorics.baseN(devices, stepCount)

    while (true) {
        const pattern = patterns.next()
        if (!pattern) {
            break
        }

        if (pattern[0] !== devices[0]) {
            continue
        }

        if (endsWithConsecutiveItems(pattern)) {
            continue
        }

        yield pattern
    }
}

function endsWithConsecutiveItems<T>(array: T[]) {
    const lastItem = array[array.length - 1]
    const semiLastItem = array[array.length - 2]
    return lastItem === semiLastItem
}
