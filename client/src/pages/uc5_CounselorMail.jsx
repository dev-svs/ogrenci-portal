import { useEffect, useState } from 'react';
export default function UC5() { 
  const [msg,setMsg]=useState(''); 
  useEffect(()=>setMsg('UC-5 Danışman Mail ekranı.'),[]); 
  return <p className="text-muted">{msg}</p>;
}