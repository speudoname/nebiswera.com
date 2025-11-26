import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react'

export interface SpacerOptions {
  HTMLAttributes: Record<string, any>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    spacerNode: {
      setSpacer: (options?: { height?: string }) => ReturnType
    }
  }
}

export const SpacerNode = Node.create<SpacerOptions>({
  name: 'spacerNode',

  group: 'block',

  atom: true,

  addAttributes() {
    return {
      height: {
        default: '40px',
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="spacer-node"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'spacer-node' }), 0]
  },

  addNodeView() {
    return ReactNodeViewRenderer(SpacerComponent)
  },

  addCommands() {
    return {
      setSpacer:
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

function SpacerComponent({ node, selected }: any) {
  return (
    <NodeViewWrapper className="spacer-node-wrapper">
      <div
        className={`${selected ? 'ring-2 ring-primary-500 ring-offset-2 rounded' : 'border border-dashed border-gray-300'}`}
        style={{ height: node.attrs.height }}
      >
        {selected && (
          <div className="flex items-center justify-center h-full text-xs text-text-muted">
            Spacer ({node.attrs.height})
          </div>
        )}
      </div>
    </NodeViewWrapper>
  )
}
