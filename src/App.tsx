
import React from 'react';
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Login from './pages/Login';
import Home from './pages/Home';
import ClientDashboard from './pages/ClientDashboard';
import ClientTasks from './pages/ClientTasks';
import ClientChecklist from './pages/ClientChecklist';
import ClientAccess from './pages/ClientAccess';
import ClientFinancial from './pages/ClientFinancial';
import TeamDashboard from './pages/TeamDashboard';
import TeamTasks from './pages/TeamTasks';
import TeamChecklist from './pages/TeamChecklist';
import TeamAccess from './pages/TeamAccess';
import TeamClients from './pages/TeamClients';
import TeamFinancial from './pages/TeamFinancial';
import NotFound from './pages/NotFound';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <BrowserRouter>
            <Routes>
              {/* Rotas públicas */}
             <Route path="/" element={<Home />} />
             <Route path="/login" element={<Login />} />
              
              {/* Rotas protegidas para clientes */}
              <Route path="/dashboard-client" element={
                <ProtectedRoute requiredRole="client">
                  <ClientDashboard />
                </ProtectedRoute>
              } />
              <Route path="/tasks-client" element={
                <ProtectedRoute requiredRole="client">
                  <ClientTasks />
                </ProtectedRoute>
              } />
              <Route path="/checklist-client" element={
                <ProtectedRoute requiredRole="client">
                  <ClientChecklist />
                </ProtectedRoute>
              } />
              <Route path="/access-client" element={
                <ProtectedRoute requiredRole="client">
                  <ClientAccess />
                </ProtectedRoute>
              } />
              <Route path="/financial-client" element={
                <ProtectedRoute requiredRole="client">
                  <ClientFinancial />
                </ProtectedRoute>
              } />
              
              {/* Rotas protegidas para equipe DMM */}
              <Route path="/dashboard-team" element={
                <ProtectedRoute requiredRole="dmm">
                  <TeamDashboard />
                </ProtectedRoute>
              } />
              <Route path="/tasks-team" element={
                <ProtectedRoute requiredRole="dmm">
                  <TeamTasks />
                </ProtectedRoute>
              } />
              <Route path="/checklist-team" element={
                <ProtectedRoute requiredRole="dmm">
                  <TeamChecklist />
                </ProtectedRoute>
              } />
              <Route path="/access-team" element={
                <ProtectedRoute requiredRole="dmm">
                  <TeamAccess />
                </ProtectedRoute>
              } />
              <Route path="/clients-team" element={
                <ProtectedRoute requiredRole="dmm">
                  <TeamClients />
                </ProtectedRoute>
              } />
              <Route path="/financial-team" element={
                <ProtectedRoute requiredRole="dmm">
                  <TeamFinancial />
                </ProtectedRoute>
              } />
              
              {/* Página 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
