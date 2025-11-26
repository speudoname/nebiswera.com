import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react'
import { useCallback } from 'react'

export interface ButtonOptions {
  HTMLAttributes: Record<string, any>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    buttonNode: {
      setButton: (options: { text: string; url: string; backgroundColor?: string; textColor?: string }) => ReturnType
    }
  }
}

export const ButtonNode = Node.create<ButtonOptions>({
  name: 'buttonNode',

  group: 'block',

  atom: true,

  addAttributes() {
    return {
      text: {
        default: 'Click here',
      },
      url: {
        default: 'https://example.com',
      },
      backgroundColor: {
        default: '#8B5CF6',
      },
      textColor: {
        default: '#FFFFFF',
      },
      align: {
        default: 'center',
      },
      borderRadius: {
        default: '4px',
      },
      padding: {
        default: '12px 24px',
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="button-node"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'button-node' }), 0]
  },

  addNodeView() {
    return ReactNodeViewRenderer(ButtonComponent)
  },

  addCommands() {
    return {
      setButton:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          })
        },
    }
  },
})

function ButtonComponent({ node, updateAttributes, deleteNode, selected }: any) {
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
  }, [])

  return (
    <NodeViewWrapper className="button-node-wrapper">
      <div
        className={`my-4 ${selected ? 'ring-2 ring-primary-500 ring-offset-2' : ''}`}
        style={{ textAlign: node.attrs.align }}
      >
        <a
          href={node.attrs.url}
          onClick={handleClick}
          style={{
            display: 'inline-block',
            backgroundColor: node.attrs.backgroundColor,
            color: node.attrs.textColor,
            padding: node.attrs.padding,
            borderRadius: node.attrs.borderRadius,
            textDecoration: 'none',
            fontWeight: '500',
            cursor: 'pointer',
          }}
          className="transition-opacity hover:opacity-90"
        >
          {node.attrs.text}
        </a>
      </div>
    </NodeViewWrapper>
  )
}
