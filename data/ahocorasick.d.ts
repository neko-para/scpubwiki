declare module "ahocorasick" {
  export default class {
    constructor(keys: string[])
    search(text: string): [number, string[]][]
  }
}
