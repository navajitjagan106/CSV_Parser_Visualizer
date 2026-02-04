import Papa from "papaparse";
import { useDispatch, useSelector } from "react-redux";
import { setData, clearData } from "./store/dataSlice";
import DataPanel from "./components/DataPanel";
import { RootState } from "./store/store";
import MainTable from "./components/MainTable";
import VisualisationPanel from "./components/VisualizationPanel";
import { useRef } from "react";


function App() {
  const dispatch = useDispatch();
  const data = useSelector((s: RootState) => s.data.rows);
  const fileRef = useRef<HTMLInputElement>(null);

  //  const [data,setData]=useState<any[]>([])

  const handleUpload = (e: any) => {
    const file = e.target.files[0];
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        //console.log("Parsed Data: ",result.data)
        // setData(result.data as any[]);
        dispatch(setData(result.data as Record<string, any>[]));

      }
    });
  }

  const handleReset = () => {
    dispatch(clearData());

    if (fileRef.current) {
      fileRef.current.value = "";
    }
  };
  return (
    
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <h2 style={{textAlign:'center'}}>CSV PARSER AND VISUALIZER</h2>

      {/* Header */}
      <div
        style={{
          padding: 10,
          borderBottom: "1px solid #ccc",
          background: "WhiteSmoke",
          display: "flex",
          gap: "10px",
          alignItems: "center"
        }}
      >
        <input type="file" accept=".csv" onChange={handleUpload} ref={fileRef} />
        <button onClick={handleReset}>
          Reset / Upload New File
        </button>
      </div>


      {/* Main Area */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* Table */}
        <div style={{ flex: 1, overflowX: "scroll", overflowY: "auto", padding: 10, borderRight: "1px solid #ccc" }}>
          <h3>Main Table</h3>
          <MainTable />
        </div>
        <div style={{ width: 200, padding: 10, borderRight: "1px solid #ccc", background: '#fafafa' }}>
          <h3>Visualisation Panel</h3>
          <VisualisationPanel />
        </div>

        <div style={{ width: 150, padding: 10, borderRight: "1px solid #ccc", background: 'GhostWhite' }}>
          <h3>Data Panel</h3>
          <DataPanel />
        </div>





      </div>
    </div>
  );
}

export default App;
