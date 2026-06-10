import { useEffect, useMemo, useState } from 'react';
import {
  FiBarChart2,
  FiCalendar,
  FiClock,
  FiEdit3,
  FiEye,
  FiMail,
  FiMapPin,
  FiPhone,
  FiRefreshCw,
  FiSearch,
  FiUser,
} from 'react-icons/fi';
import { DatePicker, Input, message, Modal, Select } from 'antd';

import api from '../../api/api';
import AdminLayout from '../../components/layout/AdminLayout';

import styles from './SalesDashboardPage.module.css';
import AttendanceActions from '../../components/attendance/AttendanceActions';
const { TextArea } = Input;

type SalesFollowUp = {
  id: number;
  disposition: string;
  notes: string;
  nextFollowUpDate?: string | null;
  createdAt: string;
  salesUser?: {
    name: string;
    email: string;
  } | null;
};

type Lead = {
  id: number;
  fullName: string;
  contactNo: string;
  email?: string | null;
  city?: string | null;
  countryApplying?: string | null;
  visaType?: string | null;
  amountPaid?: number | null;
  amountPending?: number | null;
  status: string;
  maritalStatus?: string | null;
  educationLevel?: string | null;
  educationCourse?: string | null;
  job?: string | null;
  yearsOfExperience?: string | null;
  applyingWithSpouse?: string | null;
  adminComment?: string | null;
  followUps?: SalesFollowUp[];
};

type FilterType = 'ALL' | 'TODAY' | 'CALLBACK' | 'OVERDUE' | 'PAYMENT_DONE';

const dispositionItems = [
  { label: 'Total Calls', value: 100 },
  { label: 'Contacted Lead', value: 50 },
  { label: 'Interested', value: 15 },
  { label: 'Not Interested', value: 10 },
  { label: 'Call Back', value: 10 },
  { label: 'Not Lifting', value: 10 },
  { label: 'Client Visited', value: 2 },
  { label: 'Payment Done', value: 2 },
];

export default function SalesDashboardPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [hoveredLead, setHoveredLead] = useState<Lead | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>('ALL');

  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const [followUpModalOpen, setFollowUpModalOpen] = useState(false);
  const [followUpLead, setFollowUpLead] = useState<Lead | null>(null);
  const [followUpNotes, setFollowUpNotes] = useState('');
  const [followUpDisposition, setFollowUpDisposition] = useState('CALL_BACK');
  const [followUpStatus, setFollowUpStatus] = useState('FOLLOW_UP');
  const [nextFollowUpDate, setNextFollowUpDate] = useState<string | null>(null);
  const [followUpLoading, setFollowUpLoading] = useState(false);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const response = await api.get<Lead[]>('/leads');
      setLeads(response.data);
    } catch (error: any) {
      message.error(
        error?.response?.data?.message || 'Failed to fetch sales leads',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const followUpCount = leads.reduce(
    (total, lead) => total + Number(lead.followUps?.length || 0),
    0,
  );

  const paymentDoneCount = leads.filter(
    (lead) => lead.status === 'PAYMENT_DONE',
  ).length;

  const conversionPercentage = leads.length
    ? Math.round((paymentDoneCount / leads.length) * 100)
    : 0;

  const todayDate = new Date().toDateString();

  const todayFollowUps = leads.filter((lead) =>
    lead.followUps?.some((followUp) => {
      if (!followUp.nextFollowUpDate) return false;
      return new Date(followUp.nextFollowUpDate).toDateString() === todayDate;
    }),
  );

  const pendingCallBacks = leads.filter((lead) =>
    lead.followUps?.some((followUp) => followUp.disposition === 'CALL_BACK'),
  );

  const overdueFollowUps = leads.filter((lead) =>
    lead.followUps?.some((followUp) => {
      if (!followUp.nextFollowUpDate) return false;

      return (
        new Date(followUp.nextFollowUpDate) < new Date() &&
        lead.status !== 'PAYMENT_DONE'
      );
    }),
  );

  const filteredLeads = useMemo(() => {
    let result = leads;

    if (activeFilter === 'TODAY') {
      result = todayFollowUps;
    }

    if (activeFilter === 'CALLBACK') {
      result = pendingCallBacks;
    }

    if (activeFilter === 'OVERDUE') {
      result = overdueFollowUps;
    }

    if (activeFilter === 'PAYMENT_DONE') {
      result = leads.filter((lead) => lead.status === 'PAYMENT_DONE');
    }

    const keyword = searchTerm.toLowerCase().trim();

    if (!keyword) return result;

    return result.filter(
      (lead) =>
        lead.fullName?.toLowerCase().includes(keyword) ||
        lead.contactNo?.toLowerCase().includes(keyword) ||
        lead.email?.toLowerCase().includes(keyword) ||
        lead.city?.toLowerCase().includes(keyword) ||
        lead.visaType?.toLowerCase().includes(keyword) ||
        lead.status?.toLowerCase().includes(keyword),
    );
  }, [
    leads,
    searchTerm,
    activeFilter,
    todayFollowUps,
    pendingCallBacks,
    overdueFollowUps,
  ]);

  const handleFilterClick = (filter: FilterType) => {
    setActiveFilter((current) => (current === filter ? 'ALL' : filter));
  };

  const openLeadView = (lead: Lead) => {
    setSelectedLead(lead);
    setViewModalOpen(true);
  };

  const openFollowUpModal = (lead: Lead) => {
    setFollowUpLead(lead);
    setFollowUpNotes('');
    setFollowUpDisposition('CALL_BACK');
    setFollowUpStatus('FOLLOW_UP');
    setNextFollowUpDate(null);
    setFollowUpModalOpen(true);
  };

  const handleSalesFollowUp = async () => {
    if (!followUpLead) return;

    if (!followUpNotes.trim()) {
      message.error('Please enter follow-up notes');
      return;
    }

    try {
      setFollowUpLoading(true);

      await api.post(`/leads/${followUpLead.id}/sales-follow-up`, {
        notes: followUpNotes,
        disposition: followUpDisposition,
        status: followUpStatus,
        nextFollowUpDate,
      });

      message.success(
        followUpStatus === 'PAYMENT_DONE'
          ? 'Payment done updated. Admin can now assign this lead to process.'
          : 'Follow-up saved successfully',
      );

      setFollowUpModalOpen(false);
      setFollowUpLead(null);
      setFollowUpNotes('');
      setNextFollowUpDate(null);
      fetchLeads();
    } catch (error: any) {
      message.error(
        error?.response?.data?.message || 'Failed to save follow-up',
      );
    } finally {
      setFollowUpLoading(false);
    }
  };

  return (
    <AdminLayout
      title="Sales Dashboard"
      subtitle="Manage assigned leads, follow-ups, call dispositions and daily sales activity."
    >
      <div className={styles.page}>
        <AttendanceActions />

        <div className={styles.header}>
          <div>
            <span className={styles.kicker}>Sales Department</span>
            <h1>Assigned Sales Leads</h1>
            <p>
              Only leads assigned by admin will appear here. Sales team can
              review applicant details and update follow-up dispositions.
            </p>
          </div>

          <button className={styles.refreshButton} onClick={fetchLeads}>
            <FiRefreshCw />
            Refresh
          </button>
        </div>

        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <FiUser />
            <strong>{leads.length}</strong>
            <span>Assigned Leads</span>
          </div>

          <div className={styles.statCard}>
            <FiPhone />
            <strong>0</strong>
            <span>Today Calls</span>
          </div>

          <div className={styles.statCard}>
            <FiClock />
            <strong>{followUpCount}</strong>
            <span>Follow Ups</span>
          </div>

          <div className={styles.statCard}>
            <FiBarChart2 />
            <strong>{conversionPercentage}%</strong>
            <span>Conversion</span>
          </div>
        </div>

        <div className={styles.followUpSummaryGrid}>
          <div className={styles.followUpSummaryCard}>
            <strong>{todayFollowUps.length}</strong>
            <span>Today Follow-ups</span>
          </div>

          <div className={styles.followUpSummaryCard}>
            <strong>{pendingCallBacks.length}</strong>
            <span>Pending Call Backs</span>
          </div>

          <div className={styles.followUpSummaryCard}>
            <strong>{overdueFollowUps.length}</strong>
            <span>Overdue Follow-ups</span>
          </div>
        </div>

        <div className={styles.dispositionPanel}>
          <div className={styles.panelTop}>
            <div>
              <h2>Dispositions</h2>
              <p>Daily call disposition summary.</p>
            </div>

            <FiCalendar className={styles.panelIcon} />
          </div>

          <div className={styles.dispositionGrid}>
            {dispositionItems.map((item) => (
              <div className={styles.dispositionItem} key={item.label}>
                <div>
                  <strong>{item.label}</strong>
                  <span>{item.value} clients</span>
                </div>

                <div className={styles.barTrack}>
                  <div
                    className={styles.barFill}
                    style={{ width: `${item.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.panel}>
          <div className={styles.panelTop}>
            <div>
              <h2>My Leads</h2>
              <p>Assigned enquiries from admin.</p>
            </div>

            <div className={styles.searchBox}>
              <FiSearch />
              <input
                value={searchTerm}
                placeholder="Search name, phone, visa..."
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
          </div>

          <div className={styles.filterTabs}>
            <button
              className={`${styles.filterTab} ${
                activeFilter === 'ALL' ? styles.activeFilterTab : ''
              }`}
              onClick={() => handleFilterClick('ALL')}
              type="button"
            >
              All Leads <span>{leads.length}</span>
            </button>

            <button
              className={`${styles.filterTab} ${
                activeFilter === 'TODAY' ? styles.activeFilterTab : ''
              }`}
              onClick={() => handleFilterClick('TODAY')}
              type="button"
            >
              Today Follow-ups <span>{todayFollowUps.length}</span>
            </button>

            <button
              className={`${styles.filterTab} ${
                activeFilter === 'CALLBACK' ? styles.activeFilterTab : ''
              }`}
              onClick={() => handleFilterClick('CALLBACK')}
              type="button"
            >
              Pending Call Backs <span>{pendingCallBacks.length}</span>
            </button>

            <button
              className={`${styles.filterTab} ${
                activeFilter === 'OVERDUE' ? styles.activeFilterTab : ''
              }`}
              onClick={() => handleFilterClick('OVERDUE')}
              type="button"
            >
              Overdue <span>{overdueFollowUps.length}</span>
            </button>

            <button
              className={`${styles.filterTab} ${
                activeFilter === 'PAYMENT_DONE' ? styles.activeFilterTab : ''
              }`}
              onClick={() => handleFilterClick('PAYMENT_DONE')}
              type="button"
            >
              Payment Done <span>{paymentDoneCount}</span>
            </button>
          </div>

          {loading ? (
            <div className={styles.emptyState}>Loading assigned leads...</div>
          ) : filteredLeads.length === 0 ? (
            <div className={styles.emptyState}>No assigned leads found.</div>
          ) : (
            <div className={styles.leadsList}>
              {filteredLeads.map((lead) => (
                <div
                  className={styles.leadCard}
                  key={lead.id}
                  onMouseEnter={() => setHoveredLead(lead)}
                  onMouseLeave={() => setHoveredLead(null)}
                >
                  <div className={styles.avatar}>
                    <FiUser />
                  </div>

                  <div className={styles.leadInfo}>
                    <button className={styles.nameButton}>
                      {lead.fullName}
                    </button>

                    <span>
                      <FiMapPin />
                      {lead.city || 'City not added'}
                    </span>

                    <span>
                      <FiPhone />
                      {lead.contactNo}
                    </span>

                    <span>
                      <FiMail />
                      {lead.email || 'Email not added'}
                    </span>

                    {hoveredLead?.id === lead.id && (
                      <div className={styles.hoverPopup}>
                        <strong>{lead.fullName}</strong>
                        <p>Visa: {lead.visaType || 'Not selected'}</p>
                        <p>Country: {lead.countryApplying || 'Not selected'}</p>
                        <p>
                          Experience: {lead.yearsOfExperience || 'Not added'}
                        </p>
                        <p>Education: {lead.educationLevel || 'Not added'}</p>
                      </div>
                    )}
                  </div>

                  <div className={styles.visaInfo}>
                    <strong>
                      {lead.countryApplying || 'Country not selected'}
                    </strong>
                    <span>{lead.visaType || 'Visa type not selected'}</span>
                  </div>

                  <div>
                    <div className={styles.statusPill}>{lead.status}</div>

                    {lead.followUps?.[0] && (
                      <div className={styles.lastFollowUp}>
                        <strong>Last: {lead.followUps[0].disposition}</strong>
                        <span>{lead.followUps[0].notes}</span>
                      </div>
                    )}
                  </div>

                  <div className={styles.actionGroup}>
                    <button
                      className={styles.viewButton}
                      onClick={() => openLeadView(lead)}
                      title="View Details"
                      type="button"
                    >
                      <FiEye />
                    </button>

                    <button
                      className={styles.followUpButton}
                      onClick={() => openFollowUpModal(lead)}
                      title="Add Follow-up"
                      type="button"
                    >
                      <FiEdit3 />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <Modal
          title="Sales Follow-up"
          open={followUpModalOpen}
          onCancel={() => setFollowUpModalOpen(false)}
          onOk={handleSalesFollowUp}
          confirmLoading={followUpLoading}
          okText="Save Follow-up"
        >
          <div style={{ display: 'grid', gap: 14, paddingTop: 10 }}>
            <div>
              <strong>Lead</strong>
              <p style={{ margin: '6px 0 0', color: '#6b7280' }}>
                {followUpLead?.fullName} • {followUpLead?.contactNo}
              </p>
            </div>

            <div>
              <strong>Disposition</strong>
              <Select
                value={followUpDisposition}
                style={{ width: '100%', marginTop: 8 }}
                onChange={(value) => {
                  setFollowUpDisposition(value);
                  setFollowUpStatus(
                    value === 'PAYMENT_DONE' ? 'PAYMENT_DONE' : 'FOLLOW_UP',
                  );
                }}
                options={[
                  { label: 'Call Back', value: 'CALL_BACK' },
                  { label: 'Interested', value: 'INTERESTED' },
                  { label: 'Not Interested', value: 'NOT_INTERESTED' },
                  { label: 'Not Reachable', value: 'NOT_REACHABLE' },
                  { label: 'Client Visited', value: 'CLIENT_VISITED' },
                  { label: 'Done By Others', value: 'DONE_BY_OTHERS' },
                  { label: 'Payment Done', value: 'PAYMENT_DONE' },
                ]}
              />
            </div>

            <div>
              <strong>Status</strong>
              <Select
                value={followUpStatus}
                style={{ width: '100%', marginTop: 8 }}
                onChange={(value) => setFollowUpStatus(value)}
                options={[
                  { label: 'Follow Up', value: 'FOLLOW_UP' },
                  { label: 'Call Back', value: 'CALL_BACK' },
                  { label: 'Payment Done', value: 'PAYMENT_DONE' },
                ]}
              />
            </div>

            <div>
              <strong>Next Follow-up Date</strong>
              <DatePicker
                style={{ width: '100%', marginTop: 8 }}
                onChange={(date) =>
                  setNextFollowUpDate(date ? date.format('YYYY-MM-DD') : null)
                }
              />
            </div>

            <div>
              <strong>Notes</strong>
              <TextArea
                value={followUpNotes}
                rows={4}
                style={{ marginTop: 8 }}
                placeholder="Enter customer discussion notes..."
                onChange={(event) => setFollowUpNotes(event.target.value)}
              />
            </div>
          </div>
        </Modal>

        <Modal
          open={viewModalOpen}
          footer={null}
          width={1180}
          onCancel={() => setViewModalOpen(false)}
          title="Applicant Full Details"
        >
          {selectedLead && (
            <div className={styles.salesDetailsGrid}>
              <div className={styles.detailsCard}>
                <h3>Applicant Details</h3>

                <div className={styles.detailsList}>
                  <p>
                    <strong>Name:</strong> {selectedLead.fullName}
                  </p>
                  <p>
                    <strong>Phone:</strong> {selectedLead.contactNo}
                  </p>
                  <p>
                    <strong>Email:</strong> {selectedLead.email || 'Not added'}
                  </p>
                  <p>
                    <strong>City:</strong> {selectedLead.city || 'Not added'}
                  </p>
                  <p>
                    <strong>Country:</strong>{' '}
                    {selectedLead.countryApplying || 'Not selected'}
                  </p>
                  <p>
                    <strong>Visa Type:</strong>{' '}
                    {selectedLead.visaType || 'Not selected'}
                  </p>
                  <p>
                    <strong>Education:</strong>{' '}
                    {selectedLead.educationLevel || 'Not added'}
                  </p>
                  <p>
                    <strong>Course:</strong>{' '}
                    {selectedLead.educationCourse || 'Not added'}
                  </p>
                  <p>
                    <strong>Job:</strong> {selectedLead.job || 'Not added'}
                  </p>
                  <p>
                    <strong>Experience:</strong>{' '}
                    {selectedLead.yearsOfExperience || 'Not added'}
                  </p>
                  <p>
                    <strong>Marital Status:</strong>{' '}
                    {selectedLead.maritalStatus || 'Not added'}
                  </p>
                  <p>
                    <strong>Applying With Spouse:</strong>{' '}
                    {selectedLead.applyingWithSpouse || 'No'}
                  </p>
                  <p>
                    <strong>Paid:</strong> ₹
                    {Number(selectedLead.amountPaid || 0).toLocaleString(
                      'en-IN',
                    )}
                  </p>
                  <p>
                    <strong>Pending:</strong> ₹
                    {Number(selectedLead.amountPending || 0).toLocaleString(
                      'en-IN',
                    )}
                  </p>
                </div>
              </div>

              <div className={styles.timelineCard}>
                <h3>Sales Follow-up Timeline</h3>

                <div className={styles.timelineList}>
                  {selectedLead.followUps &&
                  selectedLead.followUps.length > 0 ? (
                    selectedLead.followUps.map((followUp) => (
                      <div key={followUp.id} className={styles.timelineItem}>
                        <strong>{followUp.disposition}</strong>

                        <p className={styles.timelineNote}>{followUp.notes}</p>

                        <p className={styles.timelineMeta}>
                          By {followUp.salesUser?.name || 'Sales Executive'} •{' '}
                          {new Date(followUp.createdAt).toLocaleString('en-IN')}
                        </p>

                        {followUp.nextFollowUpDate && (
                          <p className={styles.nextFollowUpText}>
                            Next Follow-up:{' '}
                            {new Date(
                              followUp.nextFollowUpDate,
                            ).toLocaleDateString('en-IN')}
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className={styles.timelineItem}>
                      <strong>No Follow-up Yet</strong>
                      <p className={styles.timelineNote}>
                        Sales employee needs to update dispositions.
                      </p>
                    </div>
                  )}

                  <button
                    className={styles.followUpWideButton}
                    onClick={() => {
                      setViewModalOpen(false);
                      openFollowUpModal(selectedLead);
                    }}
                    type="button"
                  >
                    <FiEdit3 />
                    Add Sales Follow-up
                  </button>
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}
