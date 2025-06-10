export function hex2bin(hex: string): Uint8Array {
  const len = hex.length
  const bin = new Uint8Array(len >> 1)
  for (let i = 0; i < len; i += 2)
    bin[i >> 1] = Number.parseInt(hex.substring(i, i + 2), 16)
  return bin
}
export async function sleep(time: number): Promise<void> {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve()
    }, time)
  })
}
