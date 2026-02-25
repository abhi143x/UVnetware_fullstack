import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "../components/layouts/MainLayout.jsx";
import Home from "../components/pages/Home.jsx";
import Dashboard from "../components/pages/Dashboard.jsx";
import Editor from "../components/editor/Editor.jsx";
import Login from "../components/pages/auth/Login.jsx";
import SignUp from "../components/pages/auth/Signup.jsx";

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
        <Route
          path="/editor"
          element={
            <MainLayout>
              <Editor />
            </MainLayout>
          }
        />
        <Route 
        path="/login" 
        element={<Login />} 
        />
        <Route 
        path="/signup"
        element={<SignUp />}
        />
      </Routes>
    </BrowserRouter>
  );
}
