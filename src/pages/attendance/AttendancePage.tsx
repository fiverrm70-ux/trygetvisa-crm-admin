import { useEffect, useMemo, useState } from 'react';
import {
  FiBriefcase,
  FiClock,
  FiCoffee,
  FiLogIn,
  FiLogOut,
  FiRefreshCw,
  FiUsers,
  FiUserX,
} from 'react-icons/fi';
import { message } from 'antd';

import api from '../../api/api';
import AdminLayout from '../../components/layout/AdminLayout';

import styles from './AttendancePage.module.css';

type AttendanceRow = {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: string;
  isActive: boolean;
  loginTime: string | null;
  logoutTime: string | null;
  breakHours: string;
  lunchHours: string;
  workingHours: string;
};

type AttendanceStats = {
  presentToday: number;
  absentToday: number;
  activeEmployees: number;
  totalWorkingMinutes: number;
  totalWorkingHours: string;
};

type AttendanceResponse = {
  stats: AttendanceStats;
  rows: AttendanceRow[];
};

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  LEADS_EXECUTIVE: 'Leads Executive',
  SALES_EXECUTIVE: 'Sales Executive',
  PROCESS_EXECUTIVE: 'Process Executive',
};

function formatTime(value: string | null) {
  if (!value) return '--';

  return new Date(value).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AttendancePage() {
  const [loading, setLoading] = useState(false);
  const [attendance, setAttendance] = useState<AttendanceResponse>({
    stats: {
      presentToday: 0,
      absentToday: 0,
      activeEmployees: 0,
      totalWorkingMinutes: 0,
      totalWorkingHours: '0h 0m',
    },
    rows: [],
  });

  const activeRows = useMemo(() => {
    return attendance.rows.filter((row) => row.isActive);
  }, [attendance.rows]);

  const fetchAttendance = async () => {
    try {
      setLoading(true);

      const response = await api.get('/activity-log/today-report');

      setAttendance(response.data);
    } catch (error) {
      message.error('Failed to load attendance report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  return (
    <AdminLayout
      title="Attendance Management"
      subtitle="Track employee login, logout, break, lunch and total working hours."
    >
      <div className={styles.page}>
        <div className={styles.header}>
          <div>
            <span className={styles.kicker}>Attendance Module</span>
            <h1>Today Attendance</h1>
            <p>
              Monitor daily employee activity, working time, breaks and lunch
              duration from one clean dashboard.
            </p>
          </div>

          <button className={styles.refreshButton} onClick={fetchAttendance}>
            <FiRefreshCw />
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <FiUsers />
            </div>
            <div>
              <strong>{attendance.stats.presentToday}</strong>
              <span>Present Today</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <FiUserX />
            </div>
            <div>
              <strong>{attendance.stats.absentToday}</strong>
              <span>Absent Today</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <FiBriefcase />
            </div>
            <div>
              <strong>{attendance.stats.activeEmployees}</strong>
              <span>Active Employees</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <FiClock />
            </div>
            <div>
              <strong>{attendance.stats.totalWorkingHours}</strong>
              <span>Total Working Hours</span>
            </div>
          </div>
        </div>

        <div className={styles.panel}>
          <div className={styles.panelTop}>
            <div>
              <h2>Employee Attendance Report</h2>
              <p>Today’s login, logout, break and working hour summary.</p>
            </div>
          </div>

          <div className={styles.table}>
            <div className={styles.tableHead}>
              <span>Employee</span>
              <span>Role</span>
              <span>Login</span>
              <span>Logout</span>
              <span>Break</span>
              <span>Lunch</span>
              <span>Work Hours</span>
              <span>Status</span>
            </div>

            {activeRows.map((row) => (
              <div className={styles.tableRow} key={row.id}>
                <div className={styles.employeeCell}>
                  <div className={styles.avatar}>
                    {row.name.charAt(0).toUpperCase()}
                  </div>

                  <div>
                    <strong>{row.name}</strong>
                    <small>{row.email}</small>
                  </div>
                </div>

                <div className={styles.rolePill}>
                  {roleLabels[row.role] || row.role}
                </div>

                <div className={styles.timeCell}>
                  <FiLogIn />
                  {formatTime(row.loginTime)}
                </div>

                <div className={styles.timeCell}>
                  <FiLogOut />
                  {formatTime(row.logoutTime)}
                </div>

                <div className={styles.timeCell}>
                  <FiCoffee />
                  {row.breakHours}
                </div>

                <div className={styles.timeCell}>
                  <FiCoffee />
                  {row.lunchHours}
                </div>

                <div className={styles.workHours}>{row.workingHours}</div>

                <div
                  className={
                    row.loginTime ? styles.presentStatus : styles.absentStatus
                  }
                >
                  {row.loginTime ? 'PRESENT' : 'ABSENT'}
                </div>
              </div>
            ))}

            {!loading && activeRows.length === 0 && (
              <div className={styles.emptyState}>
                No active employees found.
              </div>
            )}

            {loading && (
              <div className={styles.emptyState}>Loading attendance...</div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
