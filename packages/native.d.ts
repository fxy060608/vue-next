declare module '@dcloudio/uni-app-x/types/native' {
  interface UniElement {
    pageId: string
    setAnyAttribute(key: string, value: any | null): void
    getAnyAttribute(key: string): any | null
  }
  interface IUniNativeElement extends UniElement {
    removeEventListener(event: string): void
  }
}

export {}
