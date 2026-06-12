import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import CollectionsPage from './pages/CollectionsPage';
import CreateCollectionPage from './pages/CreateCollectionPage';
import FindingPage from './pages/FindingPage';
import './App.css';

function App() {
  return (
    <div className="app-layout">
      <Navbar />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<CollectionsPage />} />
          <Route path="/collections/new" element={<CreateCollectionPage />} />
          <Route path="/collections/finding/:collectionName" element={<FindingPage />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  );
}

export default App;
