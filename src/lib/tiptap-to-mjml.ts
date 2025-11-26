// Wrap TipTap HTML in MJML template for email compatibility

export function wrapHtmlInMJML(htmlContent: string): string {
  return `<mjml>
  <mj-head>
    <mj-title>Email Template</mj-title>
    <mj-preview>Preview text here</mj-preview>
    <mj-attributes>
      <mj-all font-family="Arial, sans-serif" />
      <mj-text font-size="14px" color="#333333" line-height="1.6" />
      <mj-section padding="20px" />
    </mj-attributes>
    <mj-style>
      .prose p { margin: 0 0 16px 0; }
      .prose h1 { margin: 24px 0 16px 0; font-size: 32px; font-weight: bold; }
      .prose h2 { margin: 20px 0 12px 0; font-size: 24px; font-weight: bold; }
      .prose h3 { margin: 16px 0 8px 0; font-size: 18px; font-weight: bold; }
      .prose ul, .prose ol { margin: 0 0 16px 0; padding-left: 24px; }
      .prose li { margin: 4px 0; }
      .prose blockquote { border-left: 4px solid #8B5CF6; padding-left: 16px; margin: 16px 0; color: #666; }
      .prose hr { border: 0; border-top: 1px solid #E0E0E0; margin: 24px 0; }
      .prose a { color: #8B5CF6; text-decoration: underline; }
      .prose img { max-width: 100%; height: auto; display: block; margin: 16px 0; }
      .prose code { background-color: #f5f5f5; padding: 2px 6px; border-radius: 3px; font-family: monospace; }
      .prose pre { background-color: #f5f5f5; padding: 12px; border-radius: 4px; overflow-x: auto; margin: 16px 0; }
    </mj-style>
  </mj-head>
  <mj-body background-color="#f4f4f4">
    <mj-section background-color="#ffffff">
      <mj-column>
        <mj-text css-class="prose">
          ${htmlContent}
        </mj-text>
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
