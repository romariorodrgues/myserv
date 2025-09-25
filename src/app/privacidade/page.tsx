import { getLegalText } from '@/lib/legal'

export const dynamic = 'force-static'

export default async function PrivacidadePage() {
  const content = (await getLegalText('politicas')).trim()
  const sections = content.length
    ? content.split(/\r?\n\s*\r?\n/).map((section) => section.trim()).filter(Boolean)
    : []

  return (
    <div className="py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-gray-800">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">Política de Privacidade</h1>
        {sections.length > 0 ? (
          <article className="space-y-6 whitespace-pre-line leading-relaxed">
            {sections.map((section, index) => (
              <p key={index}>{section}</p>
            ))}
          </article>
        ) : (
          <p className="text-sm text-gray-500">
            O conteúdo da política de privacidade ainda não foi disponibilizado.
          </p>
        )}
      </div>
    </div>
  )
}
