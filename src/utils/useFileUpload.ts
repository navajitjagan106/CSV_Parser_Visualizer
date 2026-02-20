import { useDispatch } from "react-redux";
import { useState, useRef } from "react";
import { clearColumn } from "../store/layoutSlice";
import Papa from "papaparse";
import { clearData, setData } from "../store/dataSlice";

export function useFileUpload() {
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
       worker: true,        
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
  return { fileRef, hasFile, fileName, loading, handleUpload };

}