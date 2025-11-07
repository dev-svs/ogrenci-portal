// client/src/pages/Dashboard.jsx
import { Container } from 'react-bootstrap';
import { Routes, Route, Navigate } from 'react-router-dom';
import TopNav from '../components/TopNav.jsx';

// UC sayfaların importları
import UC1 from './uc1_ListVote.jsx';
import UC2 from './uc2_Clubs.jsx';
import UC3 from './uc3_Recommendations.jsx';
import UC4 from './uc4_Exams.jsx';
import UC5 from './uc5_CounselorMail.jsx';
import UC6 from './uc6_Appointments.jsx';

export default function Dashboard() {
  return (
    <>
      <TopNav />  {/* ✅ güncel isim */}
      <Container className="py-3">
        <Routes>
          <Route index element={<Navigate to="uc1" replace />} />
          <Route path="uc1" element={<UC1 />} />
          <Route path="uc2" element={<UC2 />} />
          <Route path="uc3" element={<UC3 />} />
          <Route path="uc4" element={<UC4 />} />
          <Route path="uc5" element={<UC5 />} />
          <Route path="uc6" element={<UC6 />} />
          <Route path="*" element={<Navigate to="uc1" replace />} />
        </Routes>
      </Container>
    </>
  );
}
