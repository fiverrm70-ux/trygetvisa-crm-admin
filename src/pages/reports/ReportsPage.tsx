import { useEffect, useState } from 'react';
import {
  FiBarChart2,
  FiBriefcase,
  FiCheckCircle,
  FiClock,
  FiRefreshCw,
  FiTrendingUp,
  FiUsers,
} from 'react-icons/fi';
import { message } from 'antd';

import api from '../../api/api';
import AdminLayout from '../../components/layout/AdminLayout';

import styles from './ReportsPage.module.css';

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

export default function ReportsPage() {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ReportData | null>(null);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const response = await api.get<ReportData>('/reports/dashboard');
      setReport(response.data);
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  return (
    <AdminLayout
      title="Reports"
      subtitle="View lead performance, sales conversion, process completion and attendance insights."
    >
      <div className={styles.page}>
        <div className={styles.header}>
          <div>
            <span className={styles.kicker}>Reports Module</span>
            <h1>CRM Reports Overview</h1>
            <p>
              Track complete CRM performance using real lead, employee,
              attendance and process workflow data.
            </p>
          </div>

          <button className={styles.refreshButton} onClick={fetchReport}>
            <FiRefreshCw />
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <FiBriefcase />
            </div>
            <div>
              <strong>{report?.leads.totalLeads || 0}</strong>
              <span>Total Leads</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <FiUsers />
            </div>
            <div>
              <strong>{report?.employees.totalEmployees || 0}</strong>
              <span>Total Employees</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <FiClock />
            </div>
            <div>
              <strong>{report?.attendance.presentToday || 0}</strong>
              <span>Present Today</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <FiTrendingUp />
            </div>
            <div>
              <strong>{report?.performance.conversionPercentage || 0}%</strong>
              <span>Sales Conversion</span>
            </div>
          </div>
        </div>

        <div className={styles.reportGrid}>
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <h2>Lead Report</h2>
                <p>Status-wise lead distribution.</p>
              </div>
              <FiBarChart2 />
            </div>

            <div className={styles.reportList}>
              <div>
                <span>New Leads</span>
                <strong>{report?.leads.newLeads || 0}</strong>
              </div>

              <div>
                <span>Assigned To Sales</span>
                <strong>{report?.leads.assignedToSales || 0}</strong>
              </div>

              <div>
                <span>Follow Up</span>
                <strong>{report?.leads.followUp || 0}</strong>
              </div>

              <div>
                <span>Call Back</span>
                <strong>{report?.leads.callBack || 0}</strong>
              </div>

              <div>
                <span>Payment Done</span>
                <strong>{report?.leads.paymentDone || 0}</strong>
              </div>

              <div>
                <span>Sale Completed</span>
                <strong>{report?.leads.saleCompleted || 0}</strong>
              </div>
            </div>
          </div>

          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <h2>Process Report</h2>
                <p>Visa processing workflow status.</p>
              </div>
              <FiCheckCircle />
            </div>

            <div className={styles.reportList}>
              <div>
                <span>Assigned To Process</span>
                <strong>{report?.leads.assignedToProcess || 0}</strong>
              </div>

              <div>
                <span>Process Running</span>
                <strong>{report?.leads.processRunning || 0}</strong>
              </div>

              <div>
                <span>Process Completed</span>
                <strong>{report?.leads.processCompleted || 0}</strong>
              </div>

              <div>
                <span>Completion Rate</span>
                <strong>
                  {report?.performance.processCompletionPercentage || 0}%
                </strong>
              </div>
            </div>
          </div>

          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <h2>Employee Report</h2>
                <p>Team-wise employee count.</p>
              </div>
              <FiUsers />
            </div>

            <div className={styles.reportList}>
              <div>
                <span>Active Employees</span>
                <strong>{report?.employees.activeEmployees || 0}</strong>
              </div>

              <div>
                <span>Leads Team</span>
                <strong>{report?.employees.leadsTeamCount || 0}</strong>
              </div>

              <div>
                <span>Sales Team</span>
                <strong>{report?.employees.salesTeamCount || 0}</strong>
              </div>

              <div>
                <span>Process Team</span>
                <strong>{report?.employees.processTeamCount || 0}</strong>
              </div>
            </div>
          </div>

          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <h2>Attendance Report</h2>
                <p>Today employee presence summary.</p>
              </div>
              <FiClock />
            </div>

            <div className={styles.reportList}>
              <div>
                <span>Present Today</span>
                <strong>{report?.attendance.presentToday || 0}</strong>
              </div>

              <div>
                <span>Absent Today</span>
                <strong>{report?.attendance.absentToday || 0}</strong>
              </div>

              <div>
                <span>Active Employees</span>
                <strong>{report?.employees.activeEmployees || 0}</strong>
              </div>

              <div>
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
            </div>
          </div>
        </div>

        {!report && !loading && (
          <div className={styles.emptyState}>No report data available.</div>
        )}
      </div>
    </AdminLayout>
  );
}
