import Welcome from './pages/Welcome'
import PdfViewerPage from './pages/PdfViewerPage'
import MoodleAuthWrapper from './components/MoodleAuthWrapper'
import { Navigate, Route, Routes } from 'react-router-dom'
import './App.css'

function AppRoutes() {
  return (
    <MoodleAuthWrapper>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/pdf/:id" element={<PdfViewerPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </MoodleAuthWrapper>
  )
}

export default AppRoutes
