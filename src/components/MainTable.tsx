
import { useMemo } from 'react';
import { RootState } from '../store/store'
import { useSelector } from 'react-redux'


export default function MainTable() {


    const { data, selected ,allcol} = useSelector(
        (s: RootState) => ({
            data: s.data.rows,
            selected: s.layout.columns,
            allcol:s.data.columns
        }),
    )

    //const selected=useSelector((s:RootState)=>s.layout.columns)

    const columns = useMemo(() => {
        if (!data.length) return []
        return selected.length > 0 ? allcol.filter(c=>selected.includes(c)) : allcol;
    }, [data, selected,allcol])
        if (!data.length) return null;


    return (
        <table border={1} cellPadding={5}>
            <thead>

                <tr>
                    <td>No</td>
                    {columns.map(c => (
                        <th key={c}>{c}</th>
                    ))}
                </tr>
            </thead>

            <tbody>
                {data.map((row: any, r) => (
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