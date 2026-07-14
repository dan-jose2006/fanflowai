import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './layouts/Layout';
import LandingPage from './pages/LandingPage';
import AssistantPage from './pages/AssistantPage';
import FanDashboard from './pages/FanDashboard';
import OrganizerDashboard from './pages/OrganizerDashboard';
import VolunteerDashboard from './pages/VolunteerDashboard';
import AccessibilityPage from './pages/AccessibilityPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<LandingPage />} />
          <Route path="assistant" element={<AssistantPage />} />
          <Route path="fan" element={<FanDashboard />} />
          <Route path="organizer" element={<OrganizerDashboard />} />
          <Route path="volunteer" element={<VolunteerDashboard />} />
          <Route path="accessibility" element={<AccessibilityPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
