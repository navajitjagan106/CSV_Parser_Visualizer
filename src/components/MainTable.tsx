
import { RootState } from '../store/store'
import { useSelector } from 'react-redux'


export default function MainTable ()  {
   

    const data=useSelector((s:RootState)=>s.data.rows)

   const selected=useSelector((s:RootState)=>s.layout.columns)

   if(!data.length) return null;

   const columns=selected.length>0?selected:Object.keys(data[0]);

  return (
    <table border={1} cellPadding={5}>
      <thead>

        <tr>
         <td>no</td>
          {columns.map(c => (
            <th key={c}>{c}</th>
          ))}
        </tr>
      </thead>

      <tbody>
        {data.map((row:any,r) => (
          <tr key={r}>
            <td>{r}</td>
            {columns.map(c => (
              <td key={c}>{row[c]}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}