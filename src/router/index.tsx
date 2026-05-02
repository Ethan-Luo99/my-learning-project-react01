import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import App from '@/App';
import { lazy, Suspense } from 'react';

const ProjectsPage = lazy(() => import('@/pages/ProjectsPage'));
const PreviewPage = lazy(() => import('@/pages/PreviewPage'));

const Layout = () => {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">加载中...</div>}>
      <Outlet />
    </Suspense>
  );
};

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Navigate to="/projects" replace />,
      },
      {
        path: 'projects',
        element: <ProjectsPage />,
      },
      {
        path: 'builder',
        element: <App />,
      },
      {
        path: 'preview',
        element: <PreviewPage />,
      },
      {
        path: '*',
        element: <Navigate to="/projects" replace />,
      },
    ],
  },
]);
