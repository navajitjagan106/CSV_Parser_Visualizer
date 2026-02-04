import React from 'react'
import { RootState } from '../store/store'
import { selectColumn} from '../store/layoutSlice'
import { useDispatch, useSelector } from 'react-redux';

export default function DataPanel ()  {
      const columns = useSelector((s: RootState) => s.data.columns);

      const selected= useSelector((s:RootState)=>s.layout.columns);

        const dispatch = useDispatch();



  return (

    <div>
        <h1>Columns</h1>

        {columns.map(col=>(
            <label key={col} style={{display:'block'}}>
            <input
            type="checkbox"
            checked={selected.includes(col)}
            onChange={()=>dispatch(selectColumn(col))}
            />
            {col}
            </label>
        ))}
    </div>
  )
}

//export default DataPanel