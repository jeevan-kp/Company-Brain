import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import EnterprisePage from './pages/EnterprisePage';
import DepartmentPage from './pages/DepartmentPage';
import ProjectPage from './pages/ProjectPage';
import ChatPage from './pages/ChatPage';
import GraphPage from './pages/GraphPage';
import AdminPage from './pages/AdminPage';
import GoldenQAPage from './pages/GoldenQAPage';
import PmOverviewPage from './pages/PmOverviewPage';
import WorkforcePage from './pages/WorkforcePage';
import DataLineagePage from './pages/DataLineagePage';
import ArchitecturePage from './pages/ArchitecturePage';
import TalentMarketplacePage from './pages/TalentMarketplacePage';
import OnboardingPage from './pages/OnboardingPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<EnterprisePage />} />
        <Route path="pm-overview" element={<PmOverviewPage />} />
        <Route path="workforce" element={<WorkforcePage />} />
        <Route path="data-lineage" element={<DataLineagePage />} />
        <Route path="architecture" element={<ArchitecturePage />} />
        <Route path="talent-marketplace" element={<TalentMarketplacePage />} />
        <Route path="onboarding" element={<OnboardingPage />} />
        <Route path="department/:departmentId" element={<DepartmentPage />} />
        <Route path="project/:projectId" element={<ProjectPage />} />
        <Route path="chat" element={<ChatPage />} />
        <Route path="graph" element={<GraphPage />} />
        <Route path="qa" element={<GoldenQAPage />} />
        <Route path="prompts" element={<GoldenQAPage />} />
        <Route path="standard-prompts" element={<GoldenQAPage />} />
        <Route path="admin" element={<AdminPage />} />
      </Route>
    </Routes>
  );
}

export default App;
