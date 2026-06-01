export const metadata = {
  title: 'FEXA Dashboard Keuangan',
  description: 'Catatan Keuangan & Target Tabungan',
}

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body>
        {children}
      </body>
    </html>
  )
}
