import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { ThemeProvider } from './components/theme-provider'
import App from './App'
import UserProfile from './pages/[username]'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
  },
  {
    path: '/:username',
    element: <UserProfile />,
  },
])

export default function Root() {
  return (
    <ThemeProvider defaultTheme="dark" attribute="class">
      <RouterProvider router={router} />
    </ThemeProvider>
  )
}
