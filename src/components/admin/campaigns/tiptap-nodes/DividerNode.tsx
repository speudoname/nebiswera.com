import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react'

export interface DividerOptions {
  HTMLAttributes: Record<string, any>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    dividerNode: {
      setDivider: (options?: { color?: string; width?: string; height?: string }) => ReturnType
    }
  }
}

export const DividerNode = Node.create<DividerOptions>({
  name: 'dividerNode',

  group: 'block',

  atom: true,

  addAttributes() {
    return {
      color: {
        default: '#E0E0E0',
      },
      width: {
        default: '100%',
      },
      height: {
        default: '1px',
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="divider-node"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'divider-node' }), 0]
  },

  addNodeView() {
    return ReactNodeViewRenderer(DividerComponent)
  },

  addCommands() {
    return {
      setDivider:
        (options = {}) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          })
        },
    }
  },
})

function DividerComponent({ node, selected }: any) {
  return (
    <NodeViewWrapper className="divider-node-wrapper">
      <div className={`my-4 ${selected ? 'ring-2 ring-primary-500 ring-offset-2 rounded' : ''}`}>
        <hr
          style={{
            border: 'none',
            borderTop: `${node.attrs.height} solid ${node.attrs.color}`,
            width: node.attrs.width,
            margin: '0 auto',
          }}
        />
      </div>
    </NodeViewWrapper>
  )
}
