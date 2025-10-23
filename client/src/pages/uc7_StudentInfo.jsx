import { useEffect, useState } from 'react';
export default function UC7() { 
  const [msg,setMsg]=useState(''); 
  useEffect(()=>setMsg('UC-7 Öğrenci Bilgileri ekranı.'),[]); 
  return <p className="text-muted">{msg}</p>;
}