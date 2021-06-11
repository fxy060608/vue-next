import { UniElement } from '@dcloudio/uni-shared'

import {
  ref,
  nextTick,
  createApp,
  createPageNode,
  createVNode as _createVNode,
  openBlock as _openBlock,
  createBlock as _createBlock,
  createCommentVNode as _createCommentVNode,
  decodeActions
} from '../src'

const defaultPageNodeOptions = {
  version: 1,
  locale: 'zh_CN',
  disableScroll: false,
  onPageScroll: false,
  onPageReachBottom: false,
  onReachBottomDistance: 50,
  statusbarHeight: 24,
  windowTop: 0,
  windowBottom: 0
}

describe('vue', () => {
  test('vdom', () => {
    const show = ref(true)
    const Page = {
      setup() {
        return () => {
          return (
            _openBlock(),
            _createBlock('view', { class: 'a' }, [
              show.value
                ? (_openBlock(),
                  _createBlock(
                    'view',
                    {
                      key: 0,
                      style: { color: 'red' }
                    },
                    '123'
                  ))
                : _createCommentVNode('v-if', true)
            ])
          )
        }
      }
    }
    const pageNode = createPageNode(1, defaultPageNodeOptions)
    createApp(Page).mount((pageNode as unknown) as UniElement)
    console.log(JSON.stringify(decodeActions(pageNode.updateActions)))
    show.value = false
    nextTick(() => {
      console.log(JSON.stringify(decodeActions(pageNode.updateActions)))
    })
  })
})
