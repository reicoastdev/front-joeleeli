import { Navigate, Route, Routes } from "react-router-dom";

import { PublicRSVPPage } from "./pages/PublicRSVPPage";
import { CheckInLoginPage } from "./pages/CheckInLoginPage";
import { CheckInPage } from "./pages/CheckInPage";

export default function App() {
  return (
    <Routes>
      <Route path="/rsvp" element={<PublicRSVPPage />} />
      <Route path="/check-in/login" element={<CheckInLoginPage />} />
      <Route path="/check-in" element={<CheckInPage />} />
      <Route path="*" element={<Navigate to="/rsvp" replace />} />
    </Routes>
  );
}
