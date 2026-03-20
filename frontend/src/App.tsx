import { Navigate, Route, Routes } from 'react-router-dom';

import { AppLayout } from './components/uiParts/AppLayout';
import { Home } from './pages/Home';
import { CardList } from './pages/CardList';
import { Review } from './pages/Review';
import { Settings } from './pages/Settings';
import { Stats } from './pages/Stats';

export function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/cards" element={<CardList />} />
        <Route path="/review" element={<Review />} />
        <Route path="/stats" element={<Stats />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
