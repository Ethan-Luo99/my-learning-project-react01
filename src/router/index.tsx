import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import App from '@/App';
import { lazy, Suspense } from 'react';

const BuilderPage = lazy(() => import('@/App'));

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
        element: <Navigate to="/builder" replace />,
      },
      {
        path: 'builder',
        element: <App />,
      },
      {
        path: 'preview',
        element: <App />,
      },
      {
        path: '*',
        element: <Navigate to="/builder" replace />,
      },
    ],
  },
]);
