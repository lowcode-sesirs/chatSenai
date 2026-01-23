import Welcome from './pages/Welcome'
import MoodleAuthWrapper from './components/MoodleAuthWrapper'
import './App.css'

function App() {
  return (
    <MoodleAuthWrapper>
      <Welcome />
    </MoodleAuthWrapper>
  )
}

export default App
