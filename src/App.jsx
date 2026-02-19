import Welcome from './pages/Welcome'
import PdfViewerPage from './pages/PdfViewerPage'
import MoodleAuthWrapper from './components/MoodleAuthWrapper'
import './App.css'

function App() {
  const isPdfRoute = typeof window !== 'undefined' && window.location.pathname.startsWith('/pdf/');

  return (
    <MoodleAuthWrapper>
      {isPdfRoute ? <PdfViewerPage /> : <Welcome />}
    </MoodleAuthWrapper>
  )
}

export default App
