import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { DataProvider } from '@/context/DataContext';
import { Layout } from '@/app/Layout';
import { HomePage } from '@/pages/HomePage';
import { ComparePage } from '@/pages/ComparePage';
import { StoresPage } from '@/pages/StoresPage';
import { StoreDetailPage } from '@/pages/StoreDetailPage';
import { SalesPage } from '@/pages/SalesPage';
import { KnowledgePage } from '@/pages/KnowledgePage';
import { AnalysisPage } from '@/pages/AnalysisPage';
import { KpiPage } from '@/pages/KpiPage';
import { CampaignsPage } from '@/pages/CampaignsPage';

export default function App() {
  return (
    <DataProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/compare" element={<ComparePage />} />
            <Route path="/stores" element={<StoresPage />} />
            <Route path="/stores/:id" element={<StoreDetailPage />} />
            <Route path="/sales" element={<SalesPage />} />
            <Route path="/knowledge" element={<KnowledgePage />} />
            <Route path="/analysis" element={<AnalysisPage />} />
            <Route path="/kpi" element={<KpiPage />} />
            <Route path="/campaigns" element={<CampaignsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </DataProvider>
  );
}
