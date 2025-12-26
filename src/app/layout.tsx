export const metadata = {
  title: 'Elicon Neural Map',
  description: 'Code dependency visualization tool',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
