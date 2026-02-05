
import { useMemo } from 'react';
import { RootState } from '../store/store'
import { useSelector } from 'react-redux'


export default function MainTable() {


    const { data, selected, allcol } = useSelector(
        (s: RootState) => ({
            data: s.data.rows,
            selected: s.layout.columns,
            allcol: s.data.columns
        }),
    )

    //const selected=useSelector((s:RootState)=>s.layout.columns)

    const columns = useMemo(() => {
        if (!data.length) return []
        return selected.length > 0 ? allcol.filter(c => selected.includes(c)) : allcol;
    }, [data, selected, allcol])
    if (!data.length) return null;


    return (
        <div className="overflow-auto">
            <table className='w-full text-sm border border-gray-400' border={1} cellPadding={5}>
                <thead className='bg-gray-100 sticky top-0'>

                    <tr >
                        <th className='border px-2 py-1'>#</th>
                        {columns.map(c => (
                            <th className='border px-2 py-1 text-left font-medium' key={c}>{c}</th>
                        ))}
                    </tr>
                </thead>

                <tbody>
                    {data.map((row: any, r) => (
                        <tr key={r} className='hover:bg-blue-50'>
                            <td className='border px-2 py-1 '>{r + 1}</td>
                            {columns.map(c => (
                                <td className='border px-2 py-1' key={c}>{row[c]}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}