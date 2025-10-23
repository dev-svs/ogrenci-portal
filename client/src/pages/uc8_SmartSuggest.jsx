import { useEffect, useState } from 'react';
export default function UC8() { 
  const [msg,setMsg]=useState(''); 
  useEffect(()=>setMsg('UC-8 Akıllı Öneri ekranı.'),[]); 
  return <p className="text-muted">{msg}</p>;
}