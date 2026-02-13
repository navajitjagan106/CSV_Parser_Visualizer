import Papa from "papaparse";
import { useDispatch} from "react-redux";
import { setData, clearData } from "./store/dataSlice";
import DataPanel from "./components/DataPanel";
import MainTable from "./components/MainTable";
import { clearColumn,clearChart } from "./store/layoutSlice";
import VisualisationPanel from "./components/VisualizationPanel";
import { useRef, useState } from "react";


function App() {
  const dispatch = useDispatch();
  const fileRef = useRef<HTMLInputElement>(null);
  const [hasFile, setHasFile] = useState(false);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpload = (e: any) => {
    const file = e.target.files[0];
    if (!file) return;

    dispatch(clearColumn());
    dispatch(clearData());

    setHasFile(true);
    setFileName(file.name);
    setLoading(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      // worker: false,        
      dynamicTyping: true,
      complete: (result) => {
        dispatch(setData(result.data as Record<string, any>[]));
        setLoading(false);
      },
      error: () => {
        setLoading(false);
        alert("Failed to parse file");
      },
    });
  }

  const handleReset = () => {
   window.location.reload();
  };
  return (

    <div className="h-screen flex flex-col bg-gray-100">
      <header className="h-12 bg-white border-b px-4 flex items-center justify-between">


        <h2 className="font-semibold text-gray-700" >CSV PARSER AND VISUALIZER</h2>

        {/* Header */}
        <div className="flex gap-2 items-center text-sm">
          {!hasFile && !loading && <input type="file" accept=".csv" onChange={handleUpload} ref={fileRef} />}
          {loading && <div className="flex items-center gap-2 text-blue-600">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a12 12 0 00-12 12h4z" />
            </svg>
            <span>Loading...</span>
          </div>
          }
          {hasFile && !loading && (
            <>
              <span className="text-gray-600 truncate max-w-[150px]">
                {fileName}
              </span>
              <button className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700" onClick={handleReset}>
                Reset
              </button>
            </>)}
        </div>

      </header>



      {/* Main */}

      <div className="flex flex-1 w-full overflow-hidden">

        {/* Report Area */}
        <main className="flex-1 min-w-0 bg-gray-50 m-2 rounded-lg shadow-sm border p-3 overflow-hidden">

          <p className="text-sm font-medium mb-2 text-gray-600">
            Report View
          </p>

          <MainTable />

        </main>

        {/* Visualization Panel */}
        <aside className="w-[260px] shrink-0 bg-gray-50 border-l flex flex-col">

          <div className="p-3 border-b font-medium text-gray-700">
            Visualizations
          </div>

          <div className="flex-1 p-3 overflow-auto">
            <VisualisationPanel key={fileName} />
          </div>

        </aside>

        {/* Data Panel */}
        <aside className="w-[240px] shrink-0 bg-gray-50 border-l flex flex-col">

          <div className="p-3 border-b font-medium text-gray-700">
            Data
          </div>

          <div className="flex-1 p-3 overflow-auto">
            <DataPanel key={fileName} />
          </div>

        </aside>

      </div>


    </div>

  );
}

export default App;
