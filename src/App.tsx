import { useState } from 'react';
import DataPanel from "./components/Panels/DataPanel";
import MainTable from "./components/MainTable";
import VisualisationPanel from "./components/Panels/VisualizationPanel";
import { useFileUpload } from "./utils/useFileUpload";

const UploadIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);

const FileIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
  </svg>
);

const ChevronIcon = ({ dir }: { dir: 'left' | 'right' }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {dir === 'left' ? <polyline points="15 18 9 12 15 6"/> : <polyline points="9 18 15 12 9 6"/>}
  </svg>
);

function SidePanel({ title, children, width = 'w-[260px]' }: { title: string; children: React.ReactNode; width?: string }) {
  return (
    <aside className={`${width} shrink-0 bg-white border-l border-gray-100 flex flex-col overflow-hidden`}>
      <div className="h-11 px-4 flex items-center border-b border-gray-100 shrink-0">
        <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-gray-400">{title}</span>
      </div>
      <div className="flex-1 overflow-y-auto">{children}</div>
    </aside>
  );
}

export default function App() {
  const { fileRef, hasFile, fileName, loading, handleUpload } = useFileUpload();
  const [rightOpen, setRightOpen] = useState(true);
  const handleReset = () => window.location.reload();

  return (
    <div className="h-screen flex flex-col bg-gray-50" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* Header — two-tone: dark left brand strip, light right actions */}
      <header className="h-12 shrink-0 flex items-stretch border-b border-gray-200 bg-white shadow-sm">

        {/* Brand */}
        <div className="flex items-center gap-2.5 px-5 bg-white min-w-[200px]">
          <div className="w-6 h-6 rounded-md bg-indigo-500 flex items-center justify-center shrink-0">
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="1" width="6" height="6" rx="1" fill="white" opacity="0.9"/>
              <rect x="9" y="1" width="6" height="6" rx="1" fill="white" opacity="0.4"/>
              <rect x="1" y="9" width="6" height="6" rx="1" fill="white" opacity="0.4"/>
              <rect x="9" y="9" width="6" height="6" rx="1" fill="white" opacity="0.9"/>
            </svg>
          </div>
          <span className="text-[13px] font-semibold text-indigo-500 tracking-wide">Pivot Table & Visualizer</span>
        </div>

        {/* Divider */}
        <div className="w-px bg-gray-200" />

        {/* Actions */}
        <div className="flex-1 flex items-center justify-end gap-3 px-5">
          {!hasFile && !loading && (
            <label className="cursor-pointer inline-flex items-center gap-2 text-[13px] font-medium text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 transition-colors px-3.5 py-1.5 rounded-md">
              <UploadIcon />
              Upload CSV
              <input type="file" accept=".csv" onChange={handleUpload} ref={fileRef} className="hidden" />
            </label>
          )}
          {loading && (
            <div className="flex items-center gap-2 text-indigo-600 text-[13px]">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="40" strokeDashoffset="15" strokeLinecap="round"/>
              </svg>
              Parsing file…
            </div>
          )}
          {hasFile && !loading && (
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-2 text-[13px] text-gray-500 bg-gray-50 border border-gray-200 rounded-md px-3 py-1.5">
                <FileIcon />
                <span className="truncate max-w-[180px] font-medium text-gray-700">{fileName}</span>
              </div>
              <button
                onClick={handleReset}
                className="text-[13px] font-medium text-gray-600 hover:text-gray-900 border border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50 px-3 py-1.5 rounded-md transition-all"
              >
                Reset
              </button>
            </div>
          )}
        </div>

        {/* Right panel toggle */}
        <button
          onClick={() => setRightOpen(o => !o)}
          className="w-10 flex items-center justify-center border-l border-gray-200 text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors shrink-0"
          title={rightOpen ? 'Hide panels' : 'Show panels'}
        >
          <ChevronIcon dir={rightOpen ? 'right' : 'left'} />
        </button>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">

        {/* Main content */}
        <main className="flex-1 min-w-0 flex flex-col overflow-hidden bg-gray-50">
          <div className="flex-1 overflow-hidden p-4">
            <div className="h-full bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
              <MainTable />
            </div>
          </div>
        </main>

        {/* Right panels — slide in/out */}
        {rightOpen && (
          <div className="flex shrink-0 border-l border-gray-200">
            <SidePanel title="Visualizations" width="w-[260px]">
              <div className="p-3">
                <VisualisationPanel key={fileName} />
              </div>
            </SidePanel>
            <SidePanel title="Fields" width="w-[220px]">
              <div className="p-3">
                <DataPanel key={fileName} />
              </div>
            </SidePanel>
          </div>
        )}

      </div>
    </div>
  );
}