import { useEffect, useState } from 'react';
import {
  FiBriefcase,
  FiCalendar,
  FiExternalLink,
  FiFileText,
  FiRefreshCw,
} from 'react-icons/fi';
import { message } from 'antd';

import api from '../../api/api';
import AdminLayout from '../../components/layout/AdminLayout';

import styles from '../employees/EmployeesPage.module.css';
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  'https://trygetvisa-crm-api.onrender.com';
type ProcessUpdate = {
  id: number;
  status: string;
  processDoneStatus: string;
  notes?: string;
  createdAt: string;
};

type ProcessDocument = {
  id: number;
  documentName: string;
  fileUrl?: string;
  status: string;
  remarks?: string;
  createdAt: string;
};

type ClientLead = {
  id: number;
  fullName: string;
  contactNo: string;
  email?: string;
  city?: string;
  countryApplying?: string;
  visaType?: string;
  status: string;
  processDoneStatus: string;
  adminComment?: string;
  processDocuments?: ProcessDocument[];
  processUpdateHistories?: ProcessUpdate[];
};

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function cleanLabel(value?: string) {
  return value ? value.replaceAll('_', ' ') : 'Not updated';
}

export default function ClientDashboardPage() {
  const [leads, setLeads] = useState<ClientLead[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMyApplications = async () => {
    try {
      setLoading(true);
      const response = await api.get('/leads');
      setLeads(response.data);
    } catch (error) {
      message.error('Failed to load your application updates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyApplications();
  }, []);

  const application = leads[0];

  return (
    <AdminLayout
      title="Client Dashboard"
      subtitle="View your visa application status, process documents and updates."
    >
      <div className={styles.page}>
        <div className={styles.header}>
          <div>
            <span className={styles.kicker}>Client Portal</span>
            <h1>My Application</h1>
            <p>
              Track your visa application progress and process team updates from
              one place.
            </p>
          </div>

          <button className={styles.addButton} onClick={fetchMyApplications}>
            <FiRefreshCw />
            Refresh
          </button>
        </div>

        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <FiBriefcase />
            </div>
            <div>
              <strong>{leads.length}</strong>
              <span>My Applications</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <FiCalendar />
            </div>
            <div>
              <strong>
                {application ? cleanLabel(application.status) : '--'}
              </strong>
              <span>Current Status</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <FiFileText />
            </div>
            <div>
              <strong>{application?.processDocuments?.length || 0}</strong>
              <span>Documents</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <FiRefreshCw />
            </div>
            <div>
              <strong>
                {application?.processUpdateHistories?.length || 0}
              </strong>
              <span>Process Updates</span>
            </div>
          </div>
        </div>

        {!loading && !application && (
          <div className={styles.panel}>
            <div className={styles.emptyState}>
              No application linked to your client account yet.
            </div>
          </div>
        )}

        {loading && (
          <div className={styles.panel}>
            <div className={styles.emptyState}>Loading your application...</div>
          </div>
        )}

        {application && (
          <>
            <div className={styles.panel}>
              <div className={styles.panelTop}>
                <div>
                  <h2>Application Details</h2>
                  <p>Basic application and visa information.</p>
                </div>
              </div>

              <div className={styles.table}>
                <div className={styles.tableRow}>
                  <div className={styles.employeeCell}>
                    <div>
                      <strong>{application.fullName}</strong>
                      <small>{application.city || 'City not added'}</small>
                    </div>
                  </div>

                  <div className={styles.contactCell}>
                    <span>{application.contactNo}</span>
                    <span>{application.email || 'Email not added'}</span>
                  </div>

                  <div className={styles.rolePill}>
                    {application.countryApplying || 'Country not added'}
                  </div>

                  <div className={styles.joinedCell}>
                    {application.visaType || 'Visa type not added'}
                  </div>

                  <div className={styles.activeStatus}>
                    {cleanLabel(application.status)}
                  </div>

                  <div className={styles.rolePill}>
                    {cleanLabel(application.processDoneStatus)}
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.panel}>
              <div className={styles.panelTop}>
                <div>
                  <h2>Process Updates</h2>
                  <p>Latest updates shared by the process team.</p>
                </div>
              </div>

              <div className={styles.table}>
                {application.processUpdateHistories?.map((update) => (
                  <div className={styles.tableRow} key={update.id}>
                    <div className={styles.employeeCell}>
                      <div>
                        <strong>{cleanLabel(update.status)}</strong>
                        <small>{formatDate(update.createdAt)}</small>
                      </div>
                    </div>

                    <div className={styles.contactCell}>
                      <span>{update.notes || 'No notes added'}</span>
                    </div>

                    <div className={styles.activeStatus}>
                      {cleanLabel(update.processDoneStatus)}
                    </div>
                  </div>
                ))}

                {application.processUpdateHistories?.length === 0 && (
                  <div className={styles.emptyState}>
                    No process updates added yet.
                  </div>
                )}
              </div>
            </div>

            <div className={styles.panel}>
              <div className={styles.panelTop}>
                <div>
                  <h2>Documents</h2>
                  <p>Documents uploaded and updated by process team.</p>
                </div>
              </div>

              <div className={styles.table}>
                {application.processDocuments?.map((document) => (
                  <div className={styles.tableRow} key={document.id}>
                    <div className={styles.employeeCell}>
                      <div>
                        <strong>{document.documentName}</strong>
                        <small>{formatDate(document.createdAt)}</small>
                      </div>
                    </div>

                    <div className={styles.contactCell}>
                      <span>{document.remarks || 'No remarks added'}</span>

                      {document.fileUrl ? (
                        <a
                          href={
                            document.fileUrl.startsWith('http')
                              ? document.fileUrl
                              : `${API_BASE_URL}${document.fileUrl}`
                          }
                          target="_blank"
                          rel="noreferrer"
                        >
                          <FiExternalLink />
                          View Uploaded File
                        </a>
                      ) : (
                        <span>No file uploaded</span>
                      )}
                    </div>

                    <div className={styles.activeStatus}>
                      {cleanLabel(document.status)}
                    </div>
                  </div>
                ))}

                {application.processDocuments?.length === 0 && (
                  <div className={styles.emptyState}>
                    No process documents uploaded yet.
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
