import { useEffect, useState } from 'react';
export default function UC3() { 
  const [msg,setMsg]=useState(''); 
  useEffect(()=>setMsg('UC-3 Öneri ekranı.'),[]); 
  return <p className="text-muted">{msg}</p>;
}