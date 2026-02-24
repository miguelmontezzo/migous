import { HashRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Routines from './pages/Routines';
import Shop from './pages/Shop';
import Inventory from './pages/Inventory';
import Profile from './pages/Profile';
import Login from './pages/Login';

export default function App() {
  return (
    <HashRouter>
      <Toaster
        theme="dark"
        position="bottom-center"
        richColors
        closeButton
        toastOptions={{
          style: {
            marginBottom: 'calc(var(--nav-height) + 16px)'
          }
        }}
      />
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="rotinas" element={<Routines />} />
            <Route path="loja" element={<Shop />} />
            <Route path="inventario" element={<Inventory />} />
            <Route path="perfil" element={<Profile />} />
          </Route>
        </Route>
      </Routes>
    </HashRouter>
  );
}
