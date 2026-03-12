import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "../components/layouts/MainLayout.jsx";
import Home from "../components/pages/Home.jsx";
import Dashboard from "../components/pages/Dashboard.jsx";
import Editor from "../components/editor/Editor.jsx";
import Login from "../components/pages/auth/Login.jsx";
import SignUp from "../components/pages/auth/SignUp.jsx";
import Feature from "../components/pages/Feature.jsx";
import Contact from "../components/pages/Contact.jsx";

import ScrollToTop from "../components/utils/ScrollToTop.jsx";
import Profile from "../components/pages/Profile";

export default function AppRoutes() {
  return (
    <BrowserRouter>

      <ScrollToTop />
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

        <Route
          path="/editor"
          element={
            <MainLayout>
              <Editor />
            </MainLayout>
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

        <Route
          path="/contact"
          element={
            <MainLayout>
              <Contact />
            </MainLayout>
          }
        />

        <Route 
        path="/profile" 
        element={
        <Profile />
        } />

      </Routes>
    </BrowserRouter>
  );
}
