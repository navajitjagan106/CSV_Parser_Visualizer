import Papa from "papaparse";
import { useDispatch, useSelector } from "react-redux";
import { setData } from "./store/dataSlice";
import DataPanel from "./components/DataPanel";
import PivotTable from "./components/MainTable";
import { RootState } from "./store/store";
import MainTable from "./components/MainTable";


function App() {
  const dispatch=useDispatch();
  const data = useSelector((s: RootState) => s.data.rows);

//  const [data,setData]=useState<any[]>([])

  const handleUpload=(e:any)=>{
    const file=e.target.files[0];
    Papa.parse(file,{
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        //console.log("Parsed Data: ",result.data)
       // setData(result.data as any[]);
       dispatch(setData(result.data as Record<string,any>[]));

    }
  });
  }
  return (
    <div style={{padding:30}}>
      <h1 className="Visualizer">
      <input type="file" accept=".csv" onChange={handleUpload}></input>
      </h1>

      {/* <hr/>
        <pre style={{ maxHeight: 400, overflow: "auto" }}>
        {JSON.stringify(data, null, 2)}
      </pre> */}
      {/* <pre>{JSON.stringify(data.slice(0, 10), null, 2)}</pre> */}
      <DataPanel/>
<MainTable/>

    </div>
  );
}

export default App;
