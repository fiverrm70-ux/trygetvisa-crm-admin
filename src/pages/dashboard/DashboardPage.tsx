import { useEffect, useState } from 'react';
import {
  FiActivity,
  FiBarChart2,
  FiBriefcase,
  FiClock,
  FiPhoneCall,
  FiRefreshCw,
  FiTrendingUp,
  FiUsers,
} from 'react-icons/fi';
import { message } from 'antd';

import api from '../../api/api';
import AdminLayout from '../../components/layout/AdminLayout';

import styles from './DashboardPage.module.css';

type ReportData = {
  leads: {
    totalLeads: number;
    newLeads: number;
    assignedToSales: number;
    followUp: number;
    callBack: number;
    paymentDone: number;
    saleCompleted: number;
    assignedToProcess: number;
    processRunning: number;
    processCompleted: number;
  };
  employees: {
    totalEmployees: number;
    activeEmployees: number;
    leadsTeamCount: number;
    salesTeamCount: number;
    processTeamCount: number;
  };
  attendance: {
    presentToday: number;
    absentToday: number;
  };
  performance: {
    conversionPercentage: number;
    processCompletionPercentage: number;
  };
};

export default function DashboardPage() {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ReportData | null>(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const response = await api.get<ReportData>('/reports/dashboard');
      setReport(response.data);
    } catch (error: any) {
      message.error(
        error?.response?.data?.message || 'Failed to load dashboard analytics',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  return (
    <AdminLayout
      title="Dashboard Overview"
      subtitle="Welcome back 👋 Here’s your real CRM performance today."
    >
      <div className={styles.content}>
        <div className={styles.heroPanel}>
          <div>
            <span>Live CRM Analytics</span>
            <h1>Business Performance Dashboard</h1>
            <p>
              Real-time overview of leads, sales conversion, process progress,
              employees and today attendance.
            </p>
          </div>

          <button onClick={fetchDashboard} type="button">
            <FiRefreshCw />
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statTop}>
              <div className={styles.statIcon}>
                <FiUsers />
              </div>
              <span className={styles.growth}>Live</span>
            </div>

            <h2>{report?.leads.totalLeads || 0}</h2>
            <p>Total Leads</p>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statTop}>
              <div className={styles.statIcon}>
                <FiPhoneCall />
              </div>
              <span className={styles.growth}>Sales</span>
            </div>

            <h2>{report?.leads.assignedToSales || 0}</h2>
            <p>Assigned To Sales</p>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statTop}>
              <div className={styles.statIcon}>
                <FiTrendingUp />
              </div>
              <span className={styles.growth}>Rate</span>
            </div>

            <h2>{report?.performance.conversionPercentage || 0}%</h2>
            <p>Sales Conversion</p>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statTop}>
              <div className={styles.statIcon}>
                <FiBriefcase />
              </div>
              <span className={styles.growth}>Process</span>
            </div>

            <h2>{report?.leads.processRunning || 0}</h2>
            <p>Processing Visas</p>
          </div>
        </div>

        <div className={styles.analyticsGrid}>
          <div className={styles.chartCard}>
            <div className={styles.cardHeader}>
              <div>
                <h3>Lead Pipeline Analytics</h3>
                <p>Status-wise lead movement across CRM.</p>
              </div>
              <FiBarChart2 />
            </div>

            <div className={styles.barList}>
              {[
                { label: 'New Leads', value: report?.leads.newLeads || 0 },
                {
                  label: 'Assigned To Sales',
                  value: report?.leads.assignedToSales || 0,
                },
                { label: 'Follow Up', value: report?.leads.followUp || 0 },
                { label: 'Call Back', value: report?.leads.callBack || 0 },
                {
                  label: 'Payment Done',
                  value: report?.leads.paymentDone || 0,
                },
                {
                  label: 'Process Completed',
                  value: report?.leads.processCompleted || 0,
                },
              ].map((item) => {
                const total = report?.leads.totalLeads || 1;
                const width = Math.max(
                  6,
                  Math.round((item.value / total) * 100),
                );

                return (
                  <div className={styles.barItem} key={item.label}>
                    <div className={styles.barInfo}>
                      <span>{item.label}</span>
                      <strong>{item.value}</strong>
                    </div>

                    <div className={styles.barTrack}>
                      <div
                        className={styles.barFill}
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className={styles.chartCard}>
            <div className={styles.cardHeader}>
              <div>
                <h3>Team Performance</h3>
                <p>Employee distribution and attendance health.</p>
              </div>
              <FiActivity />
            </div>

            <div className={styles.performanceGrid}>
              <div>
                <strong>{report?.employees.totalEmployees || 0}</strong>
                <span>Total Employees</span>
              </div>

              <div>
                <strong>{report?.employees.activeEmployees || 0}</strong>
                <span>Active Employees</span>
              </div>

              <div>
                <strong>{report?.attendance.presentToday || 0}</strong>
                <span>Present Today</span>
              </div>

              <div>
                <strong>{report?.attendance.absentToday || 0}</strong>
                <span>Absent Today</span>
              </div>
            </div>

            <div className={styles.attendanceMeter}>
              <div className={styles.meterTop}>
                <span>Attendance Coverage</span>
                <strong>
                  {report?.employees.activeEmployees
                    ? Math.round(
                        ((report?.attendance.presentToday || 0) /
                          report.employees.activeEmployees) *
                          100,
                      )
                    : 0}
                  %
                </strong>
              </div>

              <div className={styles.meterTrack}>
                <div
                  className={styles.meterFill}
                  style={{
                    width: `${
                      report?.employees.activeEmployees
                        ? Math.round(
                            ((report?.attendance.presentToday || 0) /
                              report.employees.activeEmployees) *
                              100,
                          )
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className={styles.bottomGrid}>
          <div className={styles.leadsCard}>
            <div className={styles.cardHeader}>
              <div>
                <h3>Process Completion Analytics</h3>
                <p>Visa workflow progress summary.</p>
              </div>
              <FiClock />
            </div>

            <div className={styles.table}>
              <div className={styles.tableRow}>
                <div className={styles.client}>
                  <strong>Assigned To Process</strong>
                  <span>New files moved from sales</span>
                </div>

                <div className={styles.country}>
                  {report?.leads.assignedToProcess || 0} Leads
                </div>

                <div className={styles.assigned}>Process Queue</div>

                <div className={styles.status}>Active</div>
              </div>

              <div className={styles.tableRow}>
                <div className={styles.client}>
                  <strong>Process Running</strong>
                  <span>Currently under processing</span>
                </div>

                <div className={styles.country}>
                  {report?.leads.processRunning || 0} Leads
                </div>

                <div className={styles.assigned}>Ongoing</div>

                <div className={styles.status}>Running</div>
              </div>

              <div className={styles.tableRow}>
                <div className={styles.client}>
                  <strong>Process Completed</strong>
                  <span>Completed visa workflow files</span>
                </div>

                <div className={styles.country}>
                  {report?.leads.processCompleted || 0} Leads
                </div>

                <div className={styles.assigned}>Success Rate</div>

                <div className={styles.status}>
                  {report?.performance.processCompletionPercentage || 0}%
                </div>
              </div>
            </div>
          </div>

          <div className={styles.activityCard}>
            <div className={styles.cardHeader}>
              <div>
                <h3>Quick Insights</h3>
                <p>Important live CRM numbers.</p>
              </div>
              <FiActivity />
            </div>

            <div className={styles.activityList}>
              <div className={styles.activityItem}>
                <div className={styles.activityDot}></div>
                <div className={styles.activityContent}>
                  <strong>{report?.leads.paymentDone || 0} Payment Done</strong>
                  <p>Leads ready to move into process workflow.</p>
                </div>
              </div>

              <div className={styles.activityItem}>
                <div className={styles.activityDot}></div>
                <div className={styles.activityContent}>
                  <strong>
                    {report?.employees.salesTeamCount || 0} Sales Team
                  </strong>
                  <p>Sales executives available in CRM.</p>
                </div>
              </div>

              <div className={styles.activityItem}>
                <div className={styles.activityDot}></div>
                <div className={styles.activityContent}>
                  <strong>
                    {report?.employees.processTeamCount || 0} Process Team
                  </strong>
                  <p>Process executives handling visa files.</p>
                </div>
              </div>

              <div className={styles.activityItem}>
                <div className={styles.activityDot}></div>
                <div className={styles.activityContent}>
                  <strong>
                    {report?.attendance.presentToday || 0} Present Today
                  </strong>
                  <p>Employees logged attendance for today.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {!report && !loading && (
          <div className={styles.emptyState}>No dashboard data available.</div>
        )}
      </div>
    </AdminLayout>
  );
}
