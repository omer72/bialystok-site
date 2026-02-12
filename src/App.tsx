import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import ContentPage from './pages/ContentPage';
import PostListPage from './pages/PostListPage';
import PostDetailPage from './pages/PostDetailPage';
import ContactPage from './pages/ContactPage';
import NotFoundPage from './pages/NotFoundPage';
import AdminLogin from './admin/AdminLogin';
import AdminDashboard from './admin/AdminDashboard';
import AdminPageEditor from './admin/AdminPageEditor';
import AdminRoute from './admin/AdminRoute';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Admin routes (no Layout wrapper) */}
        <Route path="/admin" element={<AdminLogin />} />
        <Route
          path="/admin/dashboard"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/editor/:id?"
          element={
            <AdminRoute>
              <AdminPageEditor />
            </AdminRoute>
          }
        />

        {/* Public routes */}
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />

          {/* Post list pages */}
          <Route path="blog" element={<PostListPage />} />
          <Route path="blog/:slug" element={<PostDetailPage />} />
          <Route path="people" element={<PostListPage />} />
          <Route path="people/:slug" element={<PostDetailPage />} />
          <Route path="events" element={<PostListPage />} />
          <Route path="events/:slug" element={<PostDetailPage />} />
          <Route path="news" element={<PostListPage />} />
          <Route path="news/:slug" element={<PostDetailPage />} />

          {/* Contact page */}
          <Route path="contact" element={<ContactPage />} />

          {/* Content pages (about sub-pages, maps, history, etc.) */}
          <Route path="about" element={<ContentPage />} />
          <Route path="about/:slug" element={<ContentPage />} />
          <Route path="maps" element={<ContentPage />} />
          <Route path="history" element={<ContentPage />} />
          <Route path="archive" element={<ContentPage />} />
          <Route path="museum" element={<ContentPage />} />
          <Route path="cemetery" element={<ContentPage />} />
          <Route path="memorial-book" element={<ContentPage />} />
          <Route path="videos" element={<ContentPage />} />
          <Route path="related-sites" element={<ContentPage />} />

          {/* Catch-all for dynamically created pages */}
          <Route path=":slug" element={<ContentPage />} />

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
