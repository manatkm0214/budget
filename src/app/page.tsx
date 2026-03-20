import { redirect } from 'next/navigation'

export default function RootPage() {
  // Handled client-side in layout via ThemeProvider / Nav
  redirect('/dashboard')
}
