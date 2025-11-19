// client/src/pages/Dashboard.jsx
import { Container } from "react-bootstrap";
import { Routes, Route, Navigate } from "react-router-dom";
import TopNav from "../components/TopNav.jsx";

// UC sayfaları
import UC1 from "./uc1_ListVote.jsx";
import UC2 from "./uc2_Clubs.jsx";
import UC3 from "./uc3_Suggestions.jsx";          
import UC5 from "./uc5_CounselorMail.jsx";
import UC6 from "./uc6_Appointments.jsx";

// Öneriler admin listesi
import SuggestionsList from "./uc3_SuggestionsList.jsx";

// Dropdowndan gelen sayfalar
import Exams from "./uc4_Exams.jsx";
import Profile from "./Profile.jsx";
import Academic from "./Academic.jsx";

export default function Dashboard() {
  return (
    <>
      <TopNav />

      <Container className="py-3">
        <Routes>

          <Route index element={<Navigate to="uc1" replace />} />

          {/* Ana sekmeler */}
          <Route path="uc1" element={<UC1 />} />
          <Route path="uc2" element={<UC2 />} />
          <Route path="uc3" element={<UC3 />} />          {/* ✔ Artık ÖNERİLER */}
          <Route path="uc5" element={<UC5 />} />
          <Route path="uc6" element={<UC6 />} />

          {/* Admin öneri listesi */}
          <Route path="suggest-list" element={<SuggestionsList />} />

          {/* Üst menü alt sayfalar */}
          <Route path="exams" element={<Exams />} />
          <Route path="profile" element={<Profile />} />
          <Route path="academic" element={<Academic />} />

          <Route path="*" element={<Navigate to="uc1" replace />} />

        </Routes>
      </Container>
    </>
  );
}
