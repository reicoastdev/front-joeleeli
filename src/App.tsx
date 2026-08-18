import { Navigate, Route, Routes } from "react-router-dom";

import { PublicRSVPPage } from "./pages/PublicRSVPPage";

export default function App() {
  return (
    <Routes>
      <Route path="/rsvp/:token" element={<PublicRSVPPage />} />
      <Route path="*" element={<Navigate to="/rsvp/indisponivel" replace />} />
    </Routes>
  );
}
