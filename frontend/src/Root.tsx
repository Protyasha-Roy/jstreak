import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { ThemeProvider } from './components/theme-provider'
import App from './App'
import UserProfile from './pages/[username]'
import JournalEntry from './pages/[username]/[year]/[month]/[date]'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
  },
  {
    path: '/:username',
    element: <UserProfile />,
  },
  {
    path: '/:username/:year/:month/:date',
    element: <JournalEntry />,
  },
])

export default function Root() {
  return (
    <ThemeProvider defaultTheme="dark" attribute="class">
      <RouterProvider router={router} />
    </ThemeProvider>
  )
}
