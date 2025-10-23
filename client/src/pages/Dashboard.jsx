import { Tabs, Tab, Container } from 'react-bootstrap';
import UC1 from './uc1_ListVote.jsx';
import UC2 from './uc2_Clubs.jsx';
import UC3 from './uc3_Recommendations.jsx';
import UC4 from './uc4_Exams.jsx';
import UC5 from './uc5_CounselorMail.jsx';
import UC6 from './uc6_Appointments.jsx';
import UC7 from './uc7_StudentInfo.jsx';
import UC8 from './uc8_SmartSuggest.jsx';

export default function Dashboard() {
  return (
    <Container>
      <Tabs defaultActiveKey="uc1" className="mb-3">
        <Tab eventKey="uc1" title="UC-1 Listeleme/Oylama"><UC1/></Tab>
        <Tab eventKey="uc2" title="UC-2 Kulüpler"><UC2/></Tab>
        <Tab eventKey="uc3" title="UC-3 Öneri"><UC3/></Tab>
        <Tab eventKey="uc4" title="UC-4 Sınav Takvimi"><UC4/></Tab>
        <Tab eventKey="uc5" title="UC-5 Danışman Mail"><UC5/></Tab>
        <Tab eventKey="uc6" title="UC-6 Randevu"><UC6/></Tab>
        <Tab eventKey="uc7" title="UC-7 Öğrenci Bilgileri"><UC7/></Tab>
        <Tab eventKey="uc8" title="UC-8 Akıllı Öneri"><UC8/></Tab>
      </Tabs>
    </Container>
  );
}
