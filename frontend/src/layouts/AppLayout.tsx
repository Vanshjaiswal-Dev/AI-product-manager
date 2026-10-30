import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

export default function AppLayout() {
  return (
    <>
      <Navbar variant="app" />
      <div className="pt-[104px]">
        <Outlet />
      </div>
    </>
  );
}
