import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { seoConfig } from '@/config/seo'

export async function GET() {
  const posts = await prisma.blogPost.findMany({
    where: { status: 'PUBLISHED' },
    orderBy: { publishedAt: 'desc' },
    take: 20,
  })

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>ნებისწერა - ბლოგი</title>
    <link>${seoConfig.siteUrl}/blog</link>
    <description>ნებისწერა ბლოგი - სტატიები პირადი განვითარების შესახებ</description>
    <language>ka</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${seoConfig.siteUrl}/feed.xml" rel="self" type="application/rss+xml"/>
    ${posts
      .filter((post) => post.slugKa && post.titleKa)
      .map(
        (post) => `
    <item>
      <title><![CDATA[${post.titleKa}]]></title>
      <link>${seoConfig.siteUrl}/blog/${post.slugKa}</link>
      <guid isPermaLink="true">${seoConfig.siteUrl}/blog/${post.slugKa}</guid>
      <pubDate>${post.publishedAt?.toUTCString() || post.createdAt.toUTCString()}</pubDate>
      ${post.excerptKa ? `<description><![CDATA[${post.excerptKa}]]></description>` : ''}
      ${post.authorName ? `<author>${post.authorName}</author>` : ''}
      ${post.category ? `<category>${post.category}</category>` : ''}
      ${post.featuredImage ? `<enclosure url="${post.featuredImage}" type="image/jpeg"/>` : ''}
    </item>`
      )
      .join('')}
  </channel>
</rss>`

  return new NextResponse(rss, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
