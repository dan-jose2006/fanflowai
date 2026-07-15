import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './layouts/Layout';

// Landing page loads eagerly — it's the entry point
import LandingPage from './pages/LandingPage';

// Heavy dashboard routes are lazy-loaded to reduce initial bundle size
const AssistantPage = lazy(() => import('./pages/AssistantPage'));
const FanDashboard = lazy(() => import('./pages/FanDashboard'));
const OrganizerDashboard = lazy(() => import('./pages/OrganizerDashboard'));
const VolunteerDashboard = lazy(() => import('./pages/VolunteerDashboard'));
const AccessibilityPage = lazy(() => import('./pages/AccessibilityPage'));

const PageLoader = () => (
  <div className="flex items-center justify-center h-64" aria-live="polite" aria-label="Loading page">
    <div className="w-8 h-8 border-2 border-fifa-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<LandingPage />} />
          <Route
            path="assistant"
            element={
              <Suspense fallback={<PageLoader />}>
                <AssistantPage />
              </Suspense>
            }
          />
          <Route
            path="fan"
            element={
              <Suspense fallback={<PageLoader />}>
                <FanDashboard />
              </Suspense>
            }
          />
          <Route
            path="organizer"
            element={
              <Suspense fallback={<PageLoader />}>
                <OrganizerDashboard />
              </Suspense>
            }
          />
          <Route
            path="volunteer"
            element={
              <Suspense fallback={<PageLoader />}>
                <VolunteerDashboard />
              </Suspense>
            }
          />
          <Route
            path="accessibility"
            element={
              <Suspense fallback={<PageLoader />}>
                <AccessibilityPage />
              </Suspense>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

