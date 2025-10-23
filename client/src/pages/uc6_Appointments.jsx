import { useEffect, useState } from 'react';
export default function UC6() { 
  const [msg,setMsg]=useState(''); 
  useEffect(()=>setMsg('UC-6 Randevu ekranı.'),[]); 
  return <p className="text-muted">{msg}</p>;
}