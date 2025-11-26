// Convert Email Blocks to MJML

import type { EmailBlock, EmailDesign } from '@/types/email-blocks'

export function generateMJMLFromBlocks(design: EmailDesign): string {
  const { blocks, globalStyles } = design

  const blocksMJML = blocks.map(block => generateBlockMJML(block)).join('\n')

  return `<mjml>
  <mj-head>
    <mj-title>Email Template</mj-title>
    <mj-preview>Preview text here</mj-preview>
    <mj-attributes>
      <mj-all font-family="${globalStyles.fontFamily}" />
      <mj-text font-size="14px" color="#333333" line-height="1.6" />
      <mj-section padding="20px" />
    </mj-attributes>
  </mj-head>
  <mj-body background-color="${globalStyles.backgroundColor}">
    <mj-section background-color="#ffffff">
      <mj-column>
${blocksMJML}
      </mj-column>
    </mj-section>

    <mj-section background-color="#f9f9f9">
      <mj-column>
        <mj-text font-size="12px" color="#666666" align="center">
          <a href="{{{ pm:unsubscribe }}}" style="color:#8B5CF6">Unsubscribe</a>
        </mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>`
}

function generateBlockMJML(block: EmailBlock): string {
  switch (block.type) {
    case 'text':
      return `        <mj-text
          font-size="${block.fontSize || '14px'}"
          color="${block.color || '#333333'}"
          align="${block.align || 'left'}"
          font-weight="${block.fontWeight || 'normal'}"
          line-height="${block.lineHeight || '1.6'}"
        >${escapeHtml(block.content)}</mj-text>`

    case 'button':
      return `        <mj-button
          background-color="${block.backgroundColor || '#8B5CF6'}"
          color="${block.color || '#FFFFFF'}"
          href="${escapeHtml(block.href)}"
          align="${block.align || 'center'}"
          border-radius="${block.borderRadius || '4px'}"
          padding="${block.padding || '12px 24px'}"
        >${escapeHtml(block.text)}</mj-button>`

    case 'image':
      const imageAttrs = [
        `src="${escapeHtml(block.src)}"`,
        `alt="${escapeHtml(block.alt)}"`,
        block.href ? `href="${escapeHtml(block.href)}"` : '',
        `width="${block.width || '600px'}"`,
        `align="${block.align || 'center'}"`,
      ].filter(Boolean).join('\n          ')
      return `        <mj-image ${imageAttrs} />`

    case 'divider':
      return `        <mj-divider
          border-color="${block.borderColor || '#E0E0E0'}"
          border-width="${block.borderWidth || '1px'}"
        />`

    case 'spacer':
      return `        <mj-spacer height="${block.height || '20px'}" />`

    case 'social':
      const socialLinks = block.links
        .map(link => `          <mj-social-element name="${link.platform}" href="${escapeHtml(link.url)}" />`)
        .join('\n')
      return `        <mj-social
          font-size="15px"
          icon-size="${block.iconSize || '30px'}"
          mode="${block.mode || 'horizontal'}"
        >
${socialLinks}
        </mj-social>`

    case 'columns':
      // For now, we'll skip columns implementation (can add later)
      return '        <!-- Columns not yet implemented -->'

    default:
      return ''
  }
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return text.replace(/[&<>"']/g, m => map[m])
}

// Generate default email design
export function getDefaultEmailDesign(): EmailDesign {
  return {
    blocks: [
      {
        id: 'block-1',
        type: 'text',
        content: 'Hello {{firstName|there}}!',
        fontSize: '20px',
        fontWeight: 'bold',
        align: 'center',
        color: '#333333',
        lineHeight: '1.6',
      },
      {
        id: 'block-2',
        type: 'text',
        content: 'Welcome to Nebiswera! We\'re excited to have you here.',
        fontSize: '14px',
        fontWeight: 'normal',
        align: 'left',
        color: '#333333',
        lineHeight: '1.6',
      },
      {
        id: 'block-3',
        type: 'button',
        text: 'Get Started',
        href: 'https://nebiswera.com',
        backgroundColor: '#8B5CF6',
        color: '#FFFFFF',
        align: 'center',
        borderRadius: '4px',
        padding: '12px 24px',
      },
    ],
    globalStyles: {
      backgroundColor: '#f4f4f4',
      fontFamily: 'Arial, sans-serif',
    },
  }
}
