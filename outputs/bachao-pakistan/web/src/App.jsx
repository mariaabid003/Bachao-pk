import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing       from './pages/Landing';
import Heatmap       from './pages/Heatmap';
import Dashboard     from './pages/Dashboard';
import Report        from './pages/Report';
import SafeSignalsMap from './pages/SafeSignalsMap';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"         element={<Landing />} />
        <Route path="/heatmap"  element={<Heatmap />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/report"   element={<Report />} />
        <Route path="/signals"  element={<SafeSignalsMap />} />
      </Routes>
    </BrowserRouter>
  );
}
