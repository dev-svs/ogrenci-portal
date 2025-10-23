import { Routes, Route } from 'react-router-dom';
import TopNav from './components/TopNav.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import PrivateRoute from './auth/PrivateRoute.jsx';

export default function App() {
  return (
    <>
      <TopNav/>
      <Routes>
        <Route element={<PrivateRoute/>}>
          <Route path="/" element={<Dashboard/>}/>
        </Route>
        <Route path="/login" element={<Login/>}/>
        <Route path="/register" element={<Register/>}/>
      </Routes>
    </>
  );
}
