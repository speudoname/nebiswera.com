import { getLocale } from 'next-intl/server'

export default async function BlogPage() {
  const locale = await getLocale()

  return (
    <div className="min-h-screen py-16 md:py-24 px-4 sm:px-6 md:px-8">
      <div className="max-w-5xl mx-auto text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-text-primary mb-8">
          {locale === 'ka' ? 'ბლოგი' : 'Blog'}
        </h1>
        <p className="text-xl text-text-secondary">
          {locale === 'ka' ? 'მალე დაემატება...' : 'Coming soon...'}
        </p>
      </div>
    </div>
  )
}
