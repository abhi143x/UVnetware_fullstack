import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "../components/layouts/MainLayout.jsx";
import Home from "../components/pages/Home.jsx";
import Dashboard from "../components/pages/Dashboard.jsx";
import Editor from "../components/editor/Editor.jsx";
import Login from "../components/pages/auth/Login.jsx";
import SignUp from "../components/pages/auth/SignUp.jsx";
import Feature from "../components/pages/Feature.jsx";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/editor" element={<Editor />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/features" element={<Feature />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
