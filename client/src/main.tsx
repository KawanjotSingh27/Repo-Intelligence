import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './AuthContext'
import App from './App'
import Landing from './pages/Landing'
import AuthCallback from './pages/AuthCallback'
import Dashboard from './pages/Dashboard'
import './styles.css'

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Landing />} />
                    <Route path="/auth" element={<AuthCallback />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/analyze" element={<App />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    </StrictMode>
)