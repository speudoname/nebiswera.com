import { getLocale } from 'next-intl/server'

export default async function ProgramsPage() {
  const locale = await getLocale()

  return (
    <div className="min-h-screen py-16 md:py-24 px-4 sm:px-6 md:px-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold text-text-primary mb-8 text-center">
          {locale === 'ka' ? 'პროგრამები' : 'Programs'}
        </h1>

        {/* Board Game Section */}
        <section id="board-game" className="py-16 scroll-mt-20">
          <h2 className="text-2xl md:text-3xl font-bold text-primary-600 mb-4">
            {locale === 'ka' ? 'სამაგიდო თამაში' : 'Board Game'}
          </h2>
          <p className="text-text-secondary">
            {locale === 'ka' ? 'მალე დაემატება...' : 'Coming soon...'}
          </p>
        </section>

        {/* Online Courses Section */}
        <section id="online-courses" className="py-16 scroll-mt-20">
          <h2 className="text-2xl md:text-3xl font-bold text-primary-600 mb-4">
            {locale === 'ka' ? 'ონლაინ კურსები' : 'Online Courses'}
          </h2>
          <p className="text-text-secondary">
            {locale === 'ka' ? 'მალე დაემატება...' : 'Coming soon...'}
          </p>
        </section>

        {/* Single Lectures Section */}
        <section id="single-lectures" className="py-16 scroll-mt-20">
          <h2 className="text-2xl md:text-3xl font-bold text-primary-600 mb-4">
            {locale === 'ka' ? 'ერთჯერადი ლექციები' : 'Single Lectures'}
          </h2>
          <p className="text-text-secondary">
            {locale === 'ka' ? 'მალე დაემატება...' : 'Coming soon...'}
          </p>
        </section>

        {/* Full Schedule Section */}
        <section id="schedule" className="py-16 scroll-mt-20">
          <h2 className="text-2xl md:text-3xl font-bold text-primary-600 mb-4">
            {locale === 'ka' ? 'სრული განრიგი' : 'Full Schedule'}
          </h2>
          <p className="text-text-secondary">
            {locale === 'ka' ? 'მალე დაემატება...' : 'Coming soon...'}
          </p>
        </section>
      </div>
    </div>
  )
}
