import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "../components/layouts/MainLayout.jsx";
import Navbar from "../components/layouts/Navbar.jsx";
import Home from "../components/pages/Home.jsx";
import Dashboard from "../components/pages/Dashboard.jsx";
import Editor from "../components/editor/Editor.jsx";
import Login from "../components/pages/auth/Login.jsx";
import SignUp from "../components/pages/auth/Signup.jsx";
import Feature from "../components/pages/Feature.jsx";

/** Editor-specific layout: navbar + remaining viewport, no footer, no scroll */
function EditorLayout({ children }) {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Navbar />
      <div className="flex-1 min-h-0 overflow-hidden">
        {children}
      </div>
    </div>
  );
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <MainLayout>
              <Home />
            </MainLayout>
          }
        />

        <Route
          path="/dashboard"
          element={
            <MainLayout>
              <Dashboard />
            </MainLayout>
          }
        />

        {/* Editor uses its own layout — no footer, viewport-locked */}
        <Route
          path="/editor"
          element={
            <EditorLayout>
              <Editor />
            </EditorLayout>
          }
        />

        <Route path="/login" element={<Login />} />

        <Route path="/signup" element={<SignUp />} />

        <Route
          path="/features"
          element={
            <MainLayout>
              <Feature />
            </MainLayout>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

