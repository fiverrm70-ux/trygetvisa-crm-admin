import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  FiBarChart2,
  FiBriefcase,
  FiCalendar,
  FiGrid,
  FiLogOut,
  FiPhoneCall,
  FiSearch,
  FiShield,
  FiUsers,
} from 'react-icons/fi';

import api from '../../api/api';
import styles from './AdminLayout.module.css';

type AdminLayoutProps = {
  children: ReactNode;
  title: string;
  subtitle: string;
};

type UserRole =
  | 'SUPER_ADMIN'
  | 'LEADS_EXECUTIVE'
  | 'SALES_EXECUTIVE'
  | 'PROCESS_EXECUTIVE'
  | 'CLIENT';

type Holiday = {
  id: number;
  title: string;
  date: string;
  isActive: boolean;
};

const allMenuItems = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: <FiGrid />,
    roles: ['SUPER_ADMIN'],
  },
  {
    label: 'Employees',
    path: '/employees',
    icon: <FiUsers />,
    roles: ['SUPER_ADMIN'],
  },
  {
    label: 'Leads',
    path: '/leads',
    icon: <FiPhoneCall />,
    roles: ['SUPER_ADMIN'],
  },
  {
    label: 'Clients',
    path: '/clients',
    icon: <FiUsers />,
    roles: ['SUPER_ADMIN'],
  },
  {
    label: 'My Leads',
    path: '/leads-dashboard',
    icon: <FiPhoneCall />,
    roles: ['LEADS_EXECUTIVE'],
  },
  {
    label: 'Sales Leads',
    path: '/sales-dashboard',
    icon: <FiPhoneCall />,
    roles: ['SALES_EXECUTIVE'],
  },
  {
    label: 'Process Files',
    path: '/process-dashboard',
    icon: <FiBriefcase />,
    roles: ['PROCESS_EXECUTIVE'],
  },
  {
    label: 'Holiday Calendar',
    path: '/holidays',
    icon: <FiCalendar />,
    roles: [
      'SUPER_ADMIN',
      'LEADS_EXECUTIVE',
      'SALES_EXECUTIVE',
      'PROCESS_EXECUTIVE',
      'CLIENT',
    ],
  },
  {
    label: 'Attendance',
    path: '/attendance',
    icon: <FiCalendar />,
    roles: ['SUPER_ADMIN'],
  },
  {
    label: 'Reports',
    path: '/reports',
    icon: <FiBarChart2 />,
    roles: ['SUPER_ADMIN'],
  },
];

function formatHolidayDate(date: string) {
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function AdminLayout({
  children,
  title,
  subtitle,
}: AdminLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const [holidays, setHolidays] = useState<Holiday[]>([]);

  const storedUser = localStorage.getItem('try_get_visa_user');
  const user = storedUser ? JSON.parse(storedUser) : null;

  const role = user?.role as UserRole | undefined;
  const userName = user?.name || 'User';

  const roleLabel =
    role === 'SUPER_ADMIN'
      ? 'Super Admin'
      : role === 'LEADS_EXECUTIVE'
        ? 'Leads Executive'
        : role === 'SALES_EXECUTIVE'
          ? 'Sales Executive'
          : role === 'PROCESS_EXECUTIVE'
            ? 'Process Executive'
            : role === 'CLIENT'
              ? 'Client'
              : 'CRM User';

  const menuItems = allMenuItems.filter((item) =>
    item.roles.includes(role || 'SUPER_ADMIN'),
  );

  const nextHoliday = useMemo(() => {
    const today = new Date();

    return holidays
      .filter((holiday) => holiday.isActive && new Date(holiday.date) >= today)
      .sort(
        (first, second) =>
          new Date(first.date).getTime() - new Date(second.date).getTime(),
      )[0];
  }, [holidays]);

  useEffect(() => {
    const fetchSidebarHolidays = async () => {
      try {
        const year = new Date().getFullYear();
        const response = await api.get(`/holidays/${year}`);
        setHolidays(response.data);
      } catch (error) {
        setHolidays([]);
      }
    };

    fetchSidebarHolidays();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('try_get_visa_token');
    localStorage.removeItem('try_get_visa_user');
    navigate('/login');
  };

  return (
    <div className={styles.page}>
      <aside className={styles.sidebar}>
        <div className={styles.logoBox}>
          <div className={styles.logoTop}>
            <div className={styles.logoIcon}>
              <FiShield />
            </div>

            <div className={styles.logoText}>
              <h2>TRY GET VISA</h2>
              <p>Premium CRM Panel</p>
            </div>
          </div>

          <div className={styles.adminCard}>
            <span>{roleLabel.toUpperCase()}</span>
            <strong>{userName}</strong>
            <p>Manage your assigned CRM workflow.</p>
          </div>
        </div>

        <div className={styles.menu}>
          <div className={styles.menuTitle}>MAIN NAVIGATION</div>

          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={
                location.pathname === item.path
                  ? styles.activeMenuItem
                  : styles.menuItem
              }
            >
              {item.icon}
              {item.label}
            </button>
          ))}

          <button
            type="button"
            className={styles.holidayMiniCard}
            onClick={() => navigate('/holidays')}
          >
            <div className={styles.holidayMiniIcon}>
              <FiCalendar />
            </div>

            <div>
              <span>Next Holiday</span>

              {nextHoliday ? (
                <>
                  <strong>{nextHoliday.title}</strong>
                  <p>{formatHolidayDate(nextHoliday.date)}</p>
                </>
              ) : (
                <>
                  <strong>No Upcoming</strong>
                  <p>View calendar</p>
                </>
              )}
            </div>
          </button>

          <button className={styles.menuItem} onClick={handleLogout}>
            <FiLogOut />
            Logout
          </button>
        </div>
      </aside>

      <main className={styles.main}>
        <div className={styles.topbar}>
          <div className={styles.welcome}>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>

          <div className={styles.topbarRight}>
            <div className={styles.searchBox}>
              <FiSearch />
              <input type="text" placeholder="Search leads, employees..." />
            </div>

            <div className={styles.profileBox}>
              <div className={styles.avatar}>{userName.charAt(0)}</div>

              <div className={styles.profileText}>
                <strong>{userName}</strong>
                <span>{roleLabel}</span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.content}>{children}</div>
      </main>
    </div>
  );
}
