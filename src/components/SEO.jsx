import { Helmet } from 'react-helmet-async'

export default function SEO({ title, description, path }) {
  const siteUrl = 'https://shmake.nz'
  const fullUrl = `${siteUrl}${path}`

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={fullUrl} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:site_name" content="SHMAKE" />
      <meta property="og:image" content={`${siteUrl}/assets/og-image.jpg`} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={`${siteUrl}/assets/og-image.jpg`} />
    </Helmet>
  )
}
