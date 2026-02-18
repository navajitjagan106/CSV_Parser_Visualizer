import { RootState } from '../../store/store'
import { togglePivot} from '../../store/layoutSlice'
import { useDispatch, useSelector } from 'react-redux';
import PivotControls from "../Controls/PivotControls";
import ChartControls from '../Controls/ChartControls';
import FilterControls from '../Controls/FilterControls';
import FieldsPanel from './FieldsPanel';


export default function VisualizationPanel() {

  const dispatch = useDispatch();
  const pivot = useSelector((s: RootState) => s.layout.pivot);//selecting the pivot object from the redux


  return (
    <div className='space-y-3 overflow-auto scrollbar-hidden'>

      <div className="flex items-center justify-between pb-2 border-b">
        <div className="flex items-center gap-2">
          <span className="text-sm">📊</span>
          <span className="text-sm font-semibold">Build visual</span>
        </div>

      </div>

      <ChartControls />

      <div className="border-t my-4"></div>

      {/*Filetes to filter the table */}
     
      <FilterControls/>
      <div className="border-t my-4"></div>


      {/*Table section for table mosdes such as pivot */}
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-2">
        Tables
      </p>
      <div
        className={`flex items-center justify-center gap-2 border rounded-md px-3 py-2 cursor-pointer text-sm 
           ${pivot.enabled
            ? "bg-blue-500 text-white border-blue-500"
            : "bg-white hover:bg-gray-100"}
        `}
        onClick={() => {
          dispatch(togglePivot());
        }}
      >
        📑 Pivot Table
      </div>

      {/* Pivot Controls */}

      {pivot.enabled && <PivotControls />}


      <div className="border-t my-4"></div>

        

      <FieldsPanel/>

      <div className="border-t my-4"></div>


    </div>

  )
}

