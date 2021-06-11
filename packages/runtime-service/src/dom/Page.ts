import {
  UniNode,
  NODE_TYPE_PAGE,
  UniBaseNode,
  IUniPageNode
} from '@dcloudio/uni-shared'

const BRIDGE_NODE_SYNC = 'nodeSync'

const ACTION_TYPE_PAGE_CREATE = 1
const ACTION_TYPE_PAGE_CREATED = 2
export const ACTION_TYPE_INSERT = 3
export const ACTION_TYPE_REMOVE = 4
export const ACTION_TYPE_SET_ATTRIBUTE = 5
export const ACTION_TYPE_REMOVE_ATTRIBUTE = 6
export const ACTION_TYPE_SET_TEXT = 7

export interface PageNodeOptions {
  version: number
  locale: string
  disableScroll: boolean
  onPageScroll: boolean
  onPageReachBottom: boolean
  onReachBottomDistance: number
  statusbarHeight: number
  windowTop: number
  windowBottom: number
}

interface PageCreateData extends PageNodeOptions {}

type PageCreateAction = [typeof ACTION_TYPE_PAGE_CREATE, PageCreateData]
type PageCreatedAction = [typeof ACTION_TYPE_PAGE_CREATED]

type InsertAction = [
  typeof ACTION_TYPE_INSERT,
  number, // parentNodeId
  Record<string, any>, // Element JSON
  number? // refChildNodeId
]

type RemoveAction = [
  typeof ACTION_TYPE_REMOVE,
  number, // parentNodeId
  number // nodeId
]

type SetAttributeAction = [
  typeof ACTION_TYPE_SET_ATTRIBUTE,
  number, // nodeId
  string, // attribute name
  unknown // attribute value
]
type RemoveAttributeAction = [
  typeof ACTION_TYPE_REMOVE_ATTRIBUTE,
  number, // nodeId
  string // attribute name
]

type SetTextAction = [
  typeof ACTION_TYPE_SET_TEXT,
  number, // nodeId
  string // text content
]

type PageUpdateAction =
  | InsertAction
  | RemoveAction
  | SetAttributeAction
  | RemoveAttributeAction
  | SetTextAction

type PageAction = PageCreateAction | PageCreatedAction | PageUpdateAction

export default class UniPageNode extends UniNode implements IUniPageNode {
  pageId: number
  private _id: number = 1
  private createAction: PageCreateAction
  private createdAction: PageCreatedAction
  public updateActions: PageAction[] = []
  constructor(pageId: number, options: PageNodeOptions) {
    super(NODE_TYPE_PAGE, '#page', (null as unknown) as IUniPageNode)
    this.nodeId = this._id
    this.pageId = pageId
    this.pageNode = this

    this.createAction = [ACTION_TYPE_PAGE_CREATE, options]
    this.createdAction = [ACTION_TYPE_PAGE_CREATED]
  }
  onInsertBefore(thisNode: UniNode, newChild: UniNode) {
    pushInsertAction(
      this,
      thisNode.nodeId!,
      newChild as UniBaseNode,
      thisNode.childNodes.indexOf(newChild)
    )
    return newChild
  }
  onRemoveChild(thisNode: UniNode, oldChild: UniNode) {
    if (thisNode.parentNode) {
      pushRemoveAction(this, thisNode.nodeId!, oldChild.nodeId!)
    }
    return oldChild
  }
  onSetAttribute(thisNode: UniNode, qualifiedName: string, value: unknown) {
    if (thisNode.parentNode) {
      pushSetAttributeAction(this, thisNode.nodeId!, qualifiedName, value)
    }
  }
  onRemoveAttribute(thisNode: UniNode, qualifiedName: string) {
    if (thisNode.parentNode) {
      pushRemoveAttributeAction(this, thisNode.nodeId!, qualifiedName)
    }
  }
  onTextContent(thisNode: UniNode, text: string) {
    if (thisNode.parentNode) {
      pushSetTextAction(this, thisNode.nodeId!, text)
    }
  }
  onNodeValue(thisNode: UniNode, val: string | null) {
    if (thisNode.parentNode) {
      pushSetTextAction(this, thisNode.nodeId!, val as string)
    }
  }
  genId() {
    return ++this._id
  }
  push(action: PageAction) {
    this.updateActions.push(action)
  }
  create() {
    this.send([this.createAction])
  }
  created() {
    this.send([this.createdAction])
  }
  update() {
    if (this.updateActions.length) {
      this.send(this.updateActions)
      this.updateActions.length = 0
    }
  }
  restore() {
    this.push(this.createAction)
    // TODO restore children
    this.push(this.createdAction)
  }
  send(action: PageAction[]) {
    // @ts-expect-error
    UniServiceJSBridge.publishHandler(BRIDGE_NODE_SYNC, action, this.pageId)
  }
}

function pushInsertAction(
  pageNode: UniPageNode,
  parentNodeId: number,
  newChild: UniBaseNode,
  index: number
) {
  pageNode.push([ACTION_TYPE_INSERT, parentNodeId, newChild.toJSON(), index])
}

function pushRemoveAction(
  pageNode: UniPageNode,
  parentNodeId: number,
  nodeId: number
) {
  pageNode.push([ACTION_TYPE_REMOVE, parentNodeId, nodeId])
}

function pushSetAttributeAction(
  pageNode: UniPageNode,
  nodeId: number,
  name: string,
  value: unknown
) {
  pageNode.push([ACTION_TYPE_SET_ATTRIBUTE, nodeId, name, value])
}

function pushRemoveAttributeAction(
  pageNode: UniPageNode,
  nodeId: number,
  name: string
) {
  pageNode.push([ACTION_TYPE_REMOVE_ATTRIBUTE, nodeId, name])
}

function pushSetTextAction(
  pageNode: UniPageNode,
  nodeId: number,
  text: string
) {
  pageNode.push([ACTION_TYPE_SET_TEXT, nodeId, text])
}
