import textDecoder from '#src/lib/textDecoder.ts'

const isUtf8 = (bytes: Uint8Array) => {
  try {
    textDecoder.decode(bytes)
    return true
  } catch {
    return false
  }
}
export default isUtf8
