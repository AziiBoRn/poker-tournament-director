import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { HomeView } from './pages/HomeView';
import { DirectorView } from './pages/DirectorView';
import { TablesView } from './pages/TablesView';
import { PlayersView } from './pages/PlayersView';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Page d'Accueil : Liste des tournois */}
                <Route path="/" element={<HomeView />} />

                {/* Espace Directeur : Nécessite un ID */}
                <Route path="/tournament/:id" element={<MainLayout />}>
                    <Route index element={<DirectorView />} />
                    <Route path="tables" element={<TablesView />} />
                    <Route path="players" element={<PlayersView />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;