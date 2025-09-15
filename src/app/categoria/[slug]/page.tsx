/**
 * Redireciona uma categoria para a busca de serviços
 */

import { redirect } from 'next/navigation'

export default function CategoriaRedirectPage({ params }: { params: { slug: string } }) {
  const name = decodeURIComponent(params.slug)
  redirect(`/servicos?q=${encodeURIComponent(name)}`)
}

