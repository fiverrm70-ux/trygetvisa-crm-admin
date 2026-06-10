import { useEffect, useState } from 'react';
import {
  FiClock,
  FiCoffee,
  FiLogIn,
  FiLogOut,
  FiRefreshCw,
} from 'react-icons/fi';
import { message } from 'antd';

import api from '../../api/api';

import styles from './AttendanceActions.module.css';

type ActivityType =
  | 'LOGIN'
  | 'BREAK_START'
  | 'BREAK_END'
  | 'LUNCH_START'
  | 'LUNCH_END'
  | 'LOGOUT';

type Activity = {
  id: number;
  type: ActivityType;
  note?: string | null;
  createdAt: string;
};

type TodayActivityResponse = {
  date: string;
  activities: Activity[];
  summary: {
    loginTime: string | null;
    logoutTime: string | null;
    breakHours: string;
    lunchHours: string;
    workingHours: string;
  };
};

function formatTime(value: string | null) {
  if (!value) return '--';

  return new Date(value).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getLastActivity(activities: Activity[]) {
  if (!activities.length) return null;

  return activities[activities.length - 1];
}

export default function AttendanceActions() {
  const [loading, setLoading] = useState(false);
  const [activityData, setActivityData] = useState<TodayActivityResponse>({
    date: '',
    activities: [],
    summary: {
      loginTime: null,
      logoutTime: null,
      breakHours: '0h 0m',
      lunchHours: '0h 0m',
      workingHours: '0h 0m',
    },
  });

  const fetchMyActivity = async () => {
    try {
      const response = await api.get('/activity-log/me/today');
      setActivityData(response.data);
    } catch (error) {
      message.error('Failed to load attendance status');
    }
  };

  useEffect(() => {
    fetchMyActivity();
  }, []);

  const handleAction = async (
    endpoint: string,
    successMessage: string,
    note: string,
  ) => {
    try {
      setLoading(true);

      await api.post(`/activity-log/${endpoint}`, {
        note,
      });

      message.success(successMessage);
      fetchMyActivity();
    } catch (error: any) {
      message.error(
        error?.response?.data?.message || 'Attendance action failed',
      );
    } finally {
      setLoading(false);
    }
  };

  const lastActivity = getLastActivity(activityData.activities);

  const hasLoggedIn = Boolean(activityData.summary.loginTime);
  const hasLoggedOut = Boolean(activityData.summary.logoutTime);
  const isOnBreak = lastActivity?.type === 'BREAK_START';
  const isOnLunch = lastActivity?.type === 'LUNCH_START';

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div>
          <span>Attendance Control</span>
          <h2>Today Work Session</h2>
          <p>Mark your login, breaks, lunch and logout for daily reports.</p>
        </div>

        <button
          className={styles.refreshButton}
          onClick={fetchMyActivity}
          type="button"
        >
          <FiRefreshCw />
        </button>
      </div>

      <div className={styles.summaryGrid}>
        <div className={styles.summaryItem}>
          <FiLogIn />
          <div>
            <strong>{formatTime(activityData.summary.loginTime)}</strong>
            <small>Login Time</small>
          </div>
        </div>

        <div className={styles.summaryItem}>
          <FiCoffee />
          <div>
            <strong>{activityData.summary.breakHours}</strong>
            <small>Break Time</small>
          </div>
        </div>

        <div className={styles.summaryItem}>
          <FiCoffee />
          <div>
            <strong>{activityData.summary.lunchHours}</strong>
            <small>Lunch Time</small>
          </div>
        </div>

        <div className={styles.summaryItem}>
          <FiClock />
          <div>
            <strong>{activityData.summary.workingHours}</strong>
            <small>Work Time</small>
          </div>
        </div>
      </div>

      <div className={styles.actions}>
        <button
          className={styles.primaryButton}
          disabled={loading || hasLoggedIn}
          onClick={() =>
            handleAction('login', 'Login marked successfully', 'Work started')
          }
          type="button"
        >
          <FiLogIn />
          Login
        </button>

        <button
          className={styles.warningButton}
          disabled={
            loading || !hasLoggedIn || hasLoggedOut || isOnBreak || isOnLunch
          }
          onClick={() =>
            handleAction('break-start', 'Break started', 'Break started')
          }
          type="button"
        >
          <FiCoffee />
          Break Start
        </button>

        <button
          className={styles.warningButton}
          disabled={loading || !isOnBreak}
          onClick={() =>
            handleAction('break-end', 'Break ended', 'Break ended')
          }
          type="button"
        >
          <FiCoffee />
          Break End
        </button>

        <button
          className={styles.lunchButton}
          disabled={
            loading || !hasLoggedIn || hasLoggedOut || isOnBreak || isOnLunch
          }
          onClick={() =>
            handleAction('lunch-start', 'Lunch started', 'Lunch started')
          }
          type="button"
        >
          <FiCoffee />
          Lunch Start
        </button>

        <button
          className={styles.lunchButton}
          disabled={loading || !isOnLunch}
          onClick={() =>
            handleAction('lunch-end', 'Lunch ended', 'Lunch ended')
          }
          type="button"
        >
          <FiCoffee />
          Lunch End
        </button>

        <button
          className={styles.logoutButton}
          disabled={
            loading || !hasLoggedIn || hasLoggedOut || isOnBreak || isOnLunch
          }
          onClick={() =>
            handleAction(
              'logout',
              'Logout marked successfully',
              'Work completed',
            )
          }
          type="button"
        >
          <FiLogOut />
          Logout
        </button>
      </div>

      {hasLoggedOut && (
        <div className={styles.doneMessage}>
          Today session completed at{' '}
          {formatTime(activityData.summary.logoutTime)}.
        </div>
      )}
    </div>
  );
}
