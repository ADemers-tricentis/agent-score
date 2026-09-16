import { Navigate, Route, BrowserRouter, Routes } from "react-router-dom";
import { DeckViewer } from "./routes/DeckViewer";
import { PrintView } from "./routes/PrintView";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/deck/1" replace />} />
        <Route path="/deck" element={<Navigate to="/deck/1" replace />} />
        <Route path="/deck/:n" element={<DeckViewer />} />
        <Route path="/print" element={<PrintView />} />
        <Route path="*" element={<Navigate to="/deck/1" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
