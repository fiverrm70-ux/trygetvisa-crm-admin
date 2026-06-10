import { useEffect, useMemo, useState } from 'react';
import {
  FiEdit3,
  FiExternalLink,
  FiEye,
  FiFileText,
  FiFilter,
  FiMail,
  FiMapPin,
  FiPhone,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiUser,
  FiUserCheck,
  FiUsers,
} from 'react-icons/fi';
import { DatePicker, Input, message, Modal, Select } from 'antd';

import api from '../../api/api';
import AttendanceActions from '../../components/attendance/AttendanceActions';
import AdminLayout from '../../components/layout/AdminLayout';
import AddLeadModal from './components/AddLeadModal';

import styles from './LeadsPage.module.css';

const { TextArea } = Input;
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  'https://trygetvisa-crm-api.onrender.com';

type User = {
  id: number;
  name: string;
  email: string;
  role:
    | 'SUPER_ADMIN'
    | 'LEADS_EXECUTIVE'
    | 'SALES_EXECUTIVE'
    | 'PROCESS_EXECUTIVE'
    | 'CLIENT';
};

type SalesFollowUp = {
  id: number;
  disposition: string;
  notes?: string | null;
  nextFollowUpDate?: string | null;
  createdAt: string;
  salesUser?: User | null;
};

type ProcessDocument = {
  id: number;
  documentName: string;
  fileUrl?: string | null;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  remarks?: string | null;
  createdAt?: string;
  updatedAt?: string;
  processUser?: User | null;
};

type ProcessUpdateHistory = {
  id: number;
  status: string;
  processDoneStatus: 'PENDING' | 'YES' | 'NO';
  notes?: string | null;
  createdAt: string;
  processUser?: User | null;
};

type Lead = {
  id: number;
  fullName: string;
  contactNo: string;
  email?: string | null;
  city?: string | null;
  countryApplying?: string | null;
  schengenCountry?: string | null;
  nonSchengenCountry?: string | null;
  visaType?: string | null;
  amountPaid?: number | null;
  amountPending?: number | null;
  visaStatus?: string | null;
  status: string;
  processDoneStatus?: 'PENDING' | 'YES' | 'NO';
  adminComment?: string | null;
  createdAt: string;
  createdBy?: User | null;
  assignedToSales?: User | null;
  assignedToProcess?: User | null;
  client?: User | null;
  followUps?: SalesFollowUp[];
  processDocuments?: ProcessDocument[];
  processUpdateHistories?: ProcessUpdateHistory[];
};

type LeadFilter =
  | 'ALL'
  | 'NEW'
  | 'PAYMENT_DONE'
  | 'READY_FOR_PROCESS'
  | 'ASSIGNED_TO_PROCESS'
  | 'PROCESS_RUNNING'
  | 'PROCESS_COMPLETED'
  | 'UNASSIGNED_SALES';

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<LeadFilter>('ALL');
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [selectedLeadIds, setSelectedLeadIds] = useState<number[]>([]);

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [assignType, setAssignType] = useState<'SALES' | 'PROCESS'>('SALES');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(
    null,
  );
  const [assignLoading, setAssignLoading] = useState(false);

  const [viewLead, setViewLead] = useState<Lead | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkAssignType, setBulkAssignType] = useState<'SALES' | 'PROCESS'>(
    'SALES',
  );
  const [bulkEmployeeIds, setBulkEmployeeIds] = useState<number[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);

  const [followUpModalOpen, setFollowUpModalOpen] = useState(false);
  const [followUpLead, setFollowUpLead] = useState<Lead | null>(null);
  const [followUpNotes, setFollowUpNotes] = useState('');
  const [followUpDisposition, setFollowUpDisposition] = useState('CALL_BACK');
  const [followUpStatus, setFollowUpStatus] = useState('FOLLOW_UP');
  const [nextFollowUpDate, setNextFollowUpDate] = useState<string | null>(null);
  const [followUpLoading, setFollowUpLoading] = useState(false);

  const storedUser = localStorage.getItem('try_get_visa_user');
  const user = storedUser ? JSON.parse(storedUser) : null;
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isSalesExecutive = user?.role === 'SALES_EXECUTIVE';

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const response = await api.get<Lead[]>('/leads');
      setLeads(response.data);
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Failed to fetch leads');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    if (!isSuperAdmin) return;

    try {
      const response = await api.get<User[]>('/users');
      setEmployees(response.data);
    } catch {
      setEmployees([]);
    }
  };

  useEffect(() => {
    fetchLeads();
    fetchEmployees();
  }, []);

  const leadCounts = useMemo(() => {
    return {
      total: leads.length,
      new: leads.filter((lead) => lead.status === 'NEW').length,
      paymentDone: leads.filter((lead) => lead.status === 'PAYMENT_DONE')
        .length,
      readyForProcess: leads.filter(
        (lead) => lead.status === 'PAYMENT_DONE' && !lead.assignedToProcess?.id,
      ).length,
      assignedToProcess: leads.filter(
        (lead) => lead.status === 'ASSIGNED_TO_PROCESS',
      ).length,
      processRunning: leads.filter((lead) => lead.status === 'PROCESS_RUNNING')
        .length,
      processCompleted: leads.filter(
        (lead) => lead.status === 'PROCESS_COMPLETED',
      ).length,
      unassignedSales: leads.filter(
        (lead) => !lead.assignedToSales?.id && lead.status === 'NEW',
      ).length,
    };
  }, [leads]);

  const filteredLeads = useMemo(() => {
    const keyword = searchTerm.toLowerCase().trim();

    let list = leads;

    if (activeFilter === 'NEW') {
      list = list.filter((lead) => lead.status === 'NEW');
    }

    if (activeFilter === 'PAYMENT_DONE') {
      list = list.filter((lead) => lead.status === 'PAYMENT_DONE');
    }

    if (activeFilter === 'READY_FOR_PROCESS') {
      list = list.filter(
        (lead) => lead.status === 'PAYMENT_DONE' && !lead.assignedToProcess?.id,
      );
    }

    if (activeFilter === 'ASSIGNED_TO_PROCESS') {
      list = list.filter((lead) => lead.status === 'ASSIGNED_TO_PROCESS');
    }

    if (activeFilter === 'PROCESS_RUNNING') {
      list = list.filter((lead) => lead.status === 'PROCESS_RUNNING');
    }

    if (activeFilter === 'PROCESS_COMPLETED') {
      list = list.filter((lead) => lead.status === 'PROCESS_COMPLETED');
    }

    if (activeFilter === 'UNASSIGNED_SALES') {
      list = list.filter(
        (lead) => !lead.assignedToSales?.id && lead.status === 'NEW',
      );
    }

    if (!keyword) return list;

    return list.filter((lead) => {
      return (
        lead.fullName?.toLowerCase().includes(keyword) ||
        lead.contactNo?.toLowerCase().includes(keyword) ||
        lead.email?.toLowerCase().includes(keyword) ||
        lead.city?.toLowerCase().includes(keyword) ||
        lead.countryApplying?.toLowerCase().includes(keyword) ||
        lead.schengenCountry?.toLowerCase().includes(keyword) ||
        lead.nonSchengenCountry?.toLowerCase().includes(keyword) ||
        lead.visaType?.toLowerCase().includes(keyword) ||
        lead.status?.toLowerCase().includes(keyword)
      );
    });
  }, [leads, searchTerm, activeFilter]);

  const salesEmployees = employees.filter(
    (employee) => employee.role === 'SALES_EXECUTIVE',
  );

  const processEmployees = employees.filter(
    (employee) => employee.role === 'PROCESS_EXECUTIVE',
  );

  const assignEmployeeOptions =
    assignType === 'SALES' ? salesEmployees : processEmployees;

  const bulkEmployeeOptions =
    bulkAssignType === 'SALES' ? salesEmployees : processEmployees;

  const totalPaid = leads.reduce(
    (total, lead) => total + Number(lead.amountPaid || 0),
    0,
  );

  const totalPending = leads.reduce(
    (total, lead) => total + Number(lead.amountPending || 0),
    0,
  );

  const getCountryLabel = (lead: Lead) => {
    if (lead.countryApplying === 'SCHENGEN' && lead.schengenCountry) {
      return `SCHENGEN - ${lead.schengenCountry}`;
    }

    if (lead.countryApplying === 'NON SCHENGEN' && lead.nonSchengenCountry) {
      return `NON SCHENGEN - ${lead.nonSchengenCountry}`;
    }

    return lead.countryApplying || 'Not selected';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      NEW: 'New',
      ASSIGNED_TO_SALES: 'Assigned To Sales',
      FOLLOW_UP: 'Follow Up',
      CALL_BACK: 'Call Back',
      PAYMENT_DONE: 'Payment Done',
      SALE_COMPLETED: 'Sale Completed',
      ASSIGNED_TO_PROCESS: 'Assigned To Process',
      PROCESS_RUNNING: 'Process Running',
      PROCESS_COMPLETED: 'Process Completed',
    };

    return labels[status] || status;
  };

  const getFullFileUrl = (fileUrl?: string | null) => {
    if (!fileUrl) return '';
    if (fileUrl.startsWith('http')) return fileUrl;
    return `${API_BASE_URL}${fileUrl}`;
  };

  const openViewModal = (lead: Lead) => {
    setViewLead(lead);
    setViewModalOpen(true);
  };

  const toggleLeadSelection = (leadId: number) => {
    setSelectedLeadIds((current) =>
      current.includes(leadId)
        ? current.filter((id) => id !== leadId)
        : [...current, leadId],
    );
  };

  const toggleSelectAll = () => {
    const visibleIds = filteredLeads.map((lead) => lead.id);
    const allSelected = visibleIds.every((id) => selectedLeadIds.includes(id));

    if (allSelected) {
      setSelectedLeadIds((current) =>
        current.filter((id) => !visibleIds.includes(id)),
      );
      return;
    }

    setSelectedLeadIds((current) =>
      Array.from(new Set([...current, ...visibleIds])),
    );
  };

  const handleFilterClick = (filter: LeadFilter) => {
    setActiveFilter((current) => (current === filter ? 'ALL' : filter));
    setSelectedLeadIds([]);
  };

  const openAssignModal = (lead: Lead) => {
    setSelectedLead(lead);
    setAssignType(lead.status === 'PAYMENT_DONE' ? 'PROCESS' : 'SALES');
    setSelectedEmployeeId(null);
    setAssignModalOpen(true);
  };

  const openFollowUpModal = (lead: Lead) => {
    setFollowUpLead(lead);
    setFollowUpNotes('');
    setFollowUpDisposition('CALL_BACK');
    setFollowUpStatus('FOLLOW_UP');
    setNextFollowUpDate(null);
    setFollowUpModalOpen(true);
  };

  const handleAssignLead = async () => {
    if (!selectedLead) return;

    if (!selectedEmployeeId) {
      message.error('Please select employee');
      return;
    }

    try {
      setAssignLoading(true);

      await api.patch(`/leads/${selectedLead.id}/assign`, {
        employeeId: selectedEmployeeId,
        type: assignType,
      });

      message.success(
        assignType === 'PROCESS'
          ? 'Lead assigned to process successfully'
          : 'Lead assigned to sales successfully',
      );

      setAssignModalOpen(false);
      setSelectedLead(null);
      setSelectedEmployeeId(null);

      fetchLeads();
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Failed to assign lead');
    } finally {
      setAssignLoading(false);
    }
  };

  const handleSalesFollowUp = async () => {
    if (!followUpLead) return;

    if (!followUpNotes.trim()) {
      message.error('Please enter follow-up notes');
      return;
    }

    if (!followUpDisposition) {
      message.error('Please select disposition');
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
          ? 'Payment done updated. Admin can now assign to process.'
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

  const openBulkModal = () => {
    if (selectedLeadIds.length === 0) {
      message.error('Please select leads first');
      return;
    }

    setBulkAssignType('SALES');
    setBulkEmployeeIds([]);
    setBulkModalOpen(true);
  };

  const handleBulkAssign = async () => {
    if (selectedLeadIds.length === 0) {
      message.error('Please select leads first');
      return;
    }

    if (bulkEmployeeIds.length === 0) {
      message.error('Please select employees');
      return;
    }

    try {
      setBulkLoading(true);

      const response = await api.patch('/leads/bulk-assign/auto-distribute', {
        leadIds: selectedLeadIds,
        employeeIds: bulkEmployeeIds,
        type: bulkAssignType,
      });

      const distributionText = response.data?.distribution
        ?.map((item: any) => `${item.employeeName}: ${item.assignedCount}`)
        .join(', ');

      message.success(
        distributionText
          ? `Bulk assigned successfully. ${distributionText}`
          : 'Bulk assigned successfully',
      );

      setBulkModalOpen(false);
      setBulkEmployeeIds([]);
      setSelectedLeadIds([]);

      fetchLeads();
    } catch (error: any) {
      message.error(
        error?.response?.data?.message || 'Failed to bulk assign leads',
      );
    } finally {
      setBulkLoading(false);
    }
  };

  const filterTabs: {
    key: LeadFilter;
    label: string;
    count: number;
  }[] = [
    {
      key: 'ALL',
      label: 'All Leads',
      count: leadCounts.total,
    },
    {
      key: 'NEW',
      label: 'New Leads',
      count: leadCounts.new,
    },
    {
      key: 'UNASSIGNED_SALES',
      label: 'Unassigned Sales',
      count: leadCounts.unassignedSales,
    },
    {
      key: 'PAYMENT_DONE',
      label: 'Payment Done',
      count: leadCounts.paymentDone,
    },
    {
      key: 'READY_FOR_PROCESS',
      label: 'Ready For Process',
      count: leadCounts.readyForProcess,
    },
    {
      key: 'ASSIGNED_TO_PROCESS',
      label: 'Assigned To Process',
      count: leadCounts.assignedToProcess,
    },
    {
      key: 'PROCESS_RUNNING',
      label: 'Process Running',
      count: leadCounts.processRunning,
    },
    {
      key: 'PROCESS_COMPLETED',
      label: 'Process Completed',
      count: leadCounts.processCompleted,
    },
  ];

  const visibleIds = filteredLeads.map((lead) => lead.id);
  const allVisibleSelected =
    visibleIds.length > 0 &&
    visibleIds.every((id) => selectedLeadIds.includes(id));

  return (
    <AdminLayout
      title="Leads Department"
      subtitle="Create, track and manage visa enquiry details submitted by leads executives."
    >
      <div className={styles.page}>
        <AttendanceActions />

        <div className={styles.header}>
          <div>
            <span className={styles.kicker}>Visa Enquiries</span>
            <h1>Lead Management</h1>
            <p>
              Leads executives can submit complete customer visa information.
              Admin can review every enquiry from this panel.
            </p>
          </div>

          <div className={styles.headerActions}>
            {isSuperAdmin && (
              <button
                className={styles.bulkButton}
                disabled={selectedLeadIds.length === 0}
                onClick={openBulkModal}
              >
                <FiUsers />
                Bulk Assign ({selectedLeadIds.length})
              </button>
            )}

            {!isSalesExecutive && (
              <button
                className={styles.addButton}
                onClick={() => setIsAddLeadOpen(true)}
              >
                <FiPlus />
                Add New Lead
              </button>
            )}
          </div>
        </div>

        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <strong>{leadCounts.total}</strong>
            <span>Total Leads</span>
          </div>

          <div className={styles.statCard}>
            <strong>{leadCounts.new}</strong>
            <span>New Leads</span>
          </div>

          <div className={styles.statCard}>
            <strong>{leadCounts.readyForProcess}</strong>
            <span>Ready For Process</span>
          </div>

          <div className={styles.statCard}>
            <strong>{leadCounts.paymentDone}</strong>
            <span>Payment Done</span>
          </div>

          <div className={styles.statCard}>
            <strong>₹{totalPaid.toLocaleString('en-IN')}</strong>
            <span>Amount Paid</span>
          </div>

          <div className={styles.statCard}>
            <strong>₹{totalPending.toLocaleString('en-IN')}</strong>
            <span>Pending Amount</span>
          </div>
        </div>

        <div className={styles.panel}>
          <div className={styles.panelTop}>
            <div>
              <h2>Submitted Leads</h2>
              <p>
                Payment done leads can be assigned to process executives from
                this admin panel.
              </p>
            </div>

            <div className={styles.actions}>
              <div className={styles.searchBox}>
                <FiSearch />
                <input
                  value={searchTerm}
                  placeholder="Search name, phone, country, visa..."
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </div>

              <button
                className={styles.filterButton}
                type="button"
                onClick={fetchLeads}
                title="Refresh leads"
              >
                <FiRefreshCw />
              </button>

              <button className={styles.filterButton} type="button">
                <FiFilter />
              </button>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 10,
              marginBottom: 18,
            }}
          >
            {filterTabs.map((filter) => {
              const isActive = activeFilter === filter.key;

              return (
                <button
                  key={filter.key}
                  type="button"
                  onClick={() => handleFilterClick(filter.key)}
                  style={{
                    border: isActive
                      ? '1px solid #047857'
                      : '1px solid #e5e7eb',
                    background: isActive ? '#ecfdf5' : '#ffffff',
                    color: isActive ? '#047857' : '#374151',
                    borderRadius: 999,
                    padding: '10px 14px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    boxShadow: isActive
                      ? '0 10px 24px rgba(4, 120, 87, 0.12)'
                      : '0 8px 18px rgba(15, 23, 42, 0.05)',
                  }}
                >
                  {filter.label}
                  <span
                    style={{
                      minWidth: 26,
                      height: 24,
                      padding: '0 8px',
                      borderRadius: 999,
                      background: isActive ? '#047857' : '#f3f4f6',
                      color: isActive ? '#ffffff' : '#111827',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 12,
                    }}
                  >
                    {filter.count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className={styles.table}>
            <div className={styles.tableHead}>
              {isSuperAdmin && (
                <span className={styles.selectCell}>
                  <input
                    className={styles.checkbox}
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleSelectAll}
                  />
                </span>
              )}
              <span>Applicant</span>
              <span>Contact</span>
              <span>Visa Info</span>
              <span>Payment</span>
              <span>Assigned</span>
              <span>Status</span>
              <span>Action</span>
            </div>

            {loading ? (
              <div className={styles.emptyState}>Loading leads...</div>
            ) : filteredLeads.length === 0 ? (
              <div className={styles.emptyState}>
                No leads found for selected filter.
              </div>
            ) : (
              filteredLeads.map((lead) => (
                <div className={styles.tableRow} key={lead.id}>
                  {isSuperAdmin && (
                    <div className={styles.selectCell}>
                      <input
                        className={styles.checkbox}
                        type="checkbox"
                        checked={selectedLeadIds.includes(lead.id)}
                        onChange={() => toggleLeadSelection(lead.id)}
                      />
                    </div>
                  )}

                  <div className={styles.applicantCell}>
                    <div className={styles.avatar}>
                      <FiUser />
                    </div>

                    <div>
                      <strong>{lead.fullName}</strong>
                      <small>
                        <FiMapPin />
                        {lead.city || 'City not added'}
                      </small>
                    </div>
                  </div>

                  <div className={styles.contactCell}>
                    <span>
                      <FiPhone />
                      {lead.contactNo}
                    </span>

                    <span>
                      <FiMail />
                      {lead.email || 'Email not added'}
                    </span>
                  </div>

                  <div className={styles.visaCell}>
                    <strong>{getCountryLabel(lead)}</strong>
                    <span>{lead.visaType || 'Visa type not selected'}</span>
                  </div>

                  <div className={styles.paymentCell}>
                    <strong>
                      ₹{Number(lead.amountPaid || 0).toLocaleString('en-IN')}
                    </strong>
                    <span>
                      Pending ₹
                      {Number(lead.amountPending || 0).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className={styles.assignmentCell}>
                    <span>
                      Sales:{' '}
                      <strong>
                        {lead.assignedToSales?.name || 'Not assigned'}
                      </strong>
                    </span>
                    <span>
                      Process:{' '}
                      <strong>
                        {lead.assignedToProcess?.name || 'Not assigned'}
                      </strong>
                    </span>
                    <span>
                      Client:{' '}
                      <strong>{lead.client?.name || 'Not linked'}</strong>
                    </span>
                  </div>

                  <div
                    className={styles.statusPill}
                    style={{
                      background:
                        lead.status === 'PAYMENT_DONE'
                          ? '#ecfdf5'
                          : lead.status === 'ASSIGNED_TO_PROCESS'
                            ? '#eff6ff'
                            : undefined,
                      color:
                        lead.status === 'PAYMENT_DONE'
                          ? '#047857'
                          : lead.status === 'ASSIGNED_TO_PROCESS'
                            ? '#1d4ed8'
                            : undefined,
                      border:
                        lead.status === 'PAYMENT_DONE'
                          ? '1px solid #a7f3d0'
                          : lead.status === 'ASSIGNED_TO_PROCESS'
                            ? '1px solid #bfdbfe'
                            : undefined,
                    }}
                  >
                    {lead.visaStatus || getStatusLabel(lead.status)}
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      className={styles.viewButton}
                      type="button"
                      title="View Full Details"
                      onClick={() => openViewModal(lead)}
                    >
                      <FiEye />
                    </button>

                    {isSalesExecutive && (
                      <button
                        className={styles.viewButton}
                        type="button"
                        title="Add Sales Follow-up"
                        onClick={() => openFollowUpModal(lead)}
                      >
                        <FiEdit3 />
                      </button>
                    )}

                    {isSuperAdmin && (
                      <button
                        className={styles.viewButton}
                        type="button"
                        title={
                          lead.status === 'PAYMENT_DONE'
                            ? 'Assign To Process'
                            : 'Assign Lead'
                        }
                        onClick={() => openAssignModal(lead)}
                      >
                        <FiUserCheck />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <AddLeadModal
          open={isAddLeadOpen}
          onClose={() => setIsAddLeadOpen(false)}
          onSuccess={fetchLeads}
        />

        <Modal
          title="Lead Complete Details"
          open={viewModalOpen}
          onCancel={() => setViewModalOpen(false)}
          footer={null}
          width={1000}
          style={{ top: 24 }}
          bodyStyle={{
            maxHeight: '78vh',
            overflowY: 'auto',
            overflowX: 'hidden',
            paddingRight: 10,
          }}
        >
          {viewLead && (
            <div style={{ display: 'grid', gap: 18, paddingTop: 8 }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                  gap: 12,
                  maxWidth: '100%',
                  overflow: 'hidden',
                }}
              >
                {[
                  ['Applicant', viewLead.fullName],
                  ['Phone', viewLead.contactNo],
                  ['Email', viewLead.email || 'Not added'],
                  ['City', viewLead.city || 'Not added'],
                  ['Country', getCountryLabel(viewLead)],
                  ['Visa Type', viewLead.visaType || 'Not selected'],
                  [
                    'Amount Paid',
                    `₹${Number(viewLead.amountPaid || 0).toLocaleString(
                      'en-IN',
                    )}`,
                  ],
                  [
                    'Amount Pending',
                    `₹${Number(viewLead.amountPending || 0).toLocaleString(
                      'en-IN',
                    )}`,
                  ],
                  ['CRM Status', getStatusLabel(viewLead.status)],
                  [
                    'Sales Executive',
                    viewLead.assignedToSales?.name || 'Not assigned',
                  ],
                  [
                    'Process Executive',
                    viewLead.assignedToProcess?.name || 'Not assigned',
                  ],
                  ['Linked Client', viewLead.client?.name || 'Not linked'],
                  ['Process Done', viewLead.processDoneStatus || 'PENDING'],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    style={{
                      border: '1px solid #e5e7eb',
                      borderRadius: 16,
                      padding: 14,
                      background: '#f8fafc',
                      minWidth: 0,
                    }}
                  >
                    <span
                      style={{
                        display: 'block',
                        fontSize: 11,
                        color: '#64748b',
                        fontWeight: 900,
                        textTransform: 'uppercase',
                        marginBottom: 6,
                      }}
                    >
                      {label}
                    </span>

                    <strong
                      style={{
                        color: '#0f172a',
                        fontSize: 14,
                        wordBreak: 'break-word',
                      }}
                    >
                      {value}
                    </strong>
                  </div>
                ))}
              </div>

              <div
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: 18,
                  padding: 16,
                  background: '#ffffff',
                  maxWidth: '100%',
                  overflow: 'hidden',
                }}
              >
                <h3
                  style={{
                    margin: '0 0 12px',
                    fontSize: 16,
                    color: '#0f172a',
                  }}
                >
                  Process Documents
                </h3>

                {viewLead.processDocuments &&
                viewLead.processDocuments.length > 0 ? (
                  <div style={{ display: 'grid', gap: 10 }}>
                    {viewLead.processDocuments.map((document) => (
                      <div
                        key={document.id}
                        style={{
                          display: 'grid',
                          gap: 10,
                          border: '1px solid #eef2f7',
                          borderRadius: 14,
                          padding: 12,
                          background: '#f8fafc',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 12,
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              fontWeight: 900,
                              color: '#0f172a',
                              minWidth: 0,
                            }}
                          >
                            <FiFileText />
                            <strong
                              style={{
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {document.documentName}
                            </strong>
                          </div>

                          <span
                            style={{
                              borderRadius: 999,
                              padding: '7px 10px',
                              fontSize: 11,
                              fontWeight: 900,
                              background:
                                document.status === 'ACCEPTED'
                                  ? '#ecfdf5'
                                  : document.status === 'REJECTED'
                                    ? '#fef2f2'
                                    : '#fffbeb',
                              color:
                                document.status === 'ACCEPTED'
                                  ? '#047857'
                                  : document.status === 'REJECTED'
                                    ? '#b91c1c'
                                    : '#b45309',
                              border:
                                document.status === 'ACCEPTED'
                                  ? '1px solid #a7f3d0'
                                  : document.status === 'REJECTED'
                                    ? '1px solid #fecaca'
                                    : '1px solid #fde68a',
                            }}
                          >
                            {document.status}
                          </span>
                        </div>

                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 12,
                          }}
                        >
                          <span
                            style={{
                              color: '#64748b',
                              fontSize: 12,
                              fontWeight: 700,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {document.remarks || 'No remarks'}
                          </span>

                          {document.fileUrl ? (
                            <button
                              type="button"
                              onClick={() =>
                                window.open(
                                  getFullFileUrl(document.fileUrl),
                                  '_blank',
                                )
                              }
                              style={{
                                border: 0,
                                borderRadius: 10,
                                height: 34,
                                padding: '0 14px',
                                background: '#eff6ff',
                                color: '#1d4ed8',
                                fontWeight: 900,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 6,
                                whiteSpace: 'nowrap',
                              }}
                            >
                              <FiExternalLink />
                              View Document
                            </button>
                          ) : (
                            <span
                              style={{
                                color: '#94a3b8',
                                fontSize: 12,
                                fontWeight: 800,
                                whiteSpace: 'nowrap',
                              }}
                            >
                              Re-upload Required
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ margin: 0, color: '#64748b' }}>
                    No process documents uploaded yet.
                  </p>
                )}
              </div>

              <div
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: 18,
                  padding: 16,
                  background: '#ffffff',
                }}
              >
                <h3
                  style={{
                    margin: '0 0 12px',
                    fontSize: 16,
                    color: '#0f172a',
                  }}
                >
                  Process Update History
                </h3>

                {viewLead.processUpdateHistories &&
                viewLead.processUpdateHistories.length > 0 ? (
                  <div style={{ display: 'grid', gap: 10 }}>
                    {viewLead.processUpdateHistories.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          borderLeft: '4px solid #10b981',
                          borderRadius: 14,
                          padding: 12,
                          background: '#f8fafc',
                        }}
                      >
                        <strong style={{ color: '#047857' }}>
                          {getStatusLabel(item.status)} • Process Done:{' '}
                          {item.processDoneStatus}
                        </strong>
                        <p
                          style={{
                            margin: '6px 0',
                            color: '#334155',
                            lineHeight: 1.6,
                          }}
                        >
                          {item.notes || 'No notes'}
                        </p>
                        <small style={{ color: '#64748b', fontWeight: 700 }}>
                          {item.processUser?.name || 'Process Executive'} •{' '}
                          {new Date(item.createdAt).toLocaleString('en-IN')}
                        </small>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ margin: 0, color: '#64748b' }}>
                    No process updates yet.
                  </p>
                )}
              </div>

              <div
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: 18,
                  padding: 16,
                  background: '#ffffff',
                }}
              >
                <h3
                  style={{
                    margin: '0 0 12px',
                    fontSize: 16,
                    color: '#0f172a',
                  }}
                >
                  Sales Follow-up Timeline
                </h3>

                {viewLead.followUps && viewLead.followUps.length > 0 ? (
                  <div style={{ display: 'grid', gap: 10 }}>
                    {viewLead.followUps.map((followUp) => (
                      <div
                        key={followUp.id}
                        style={{
                          borderLeft: '4px solid #3b82f6',
                          borderRadius: 14,
                          padding: 12,
                          background: '#f8fafc',
                        }}
                      >
                        <strong style={{ color: '#1d4ed8' }}>
                          {followUp.disposition}
                        </strong>
                        <p
                          style={{
                            margin: '6px 0',
                            color: '#334155',
                            lineHeight: 1.6,
                          }}
                        >
                          {followUp.notes || 'No notes'}
                        </p>
                        <small style={{ color: '#64748b', fontWeight: 700 }}>
                          {followUp.salesUser?.name || 'Sales Executive'} •{' '}
                          {new Date(followUp.createdAt).toLocaleString('en-IN')}
                        </small>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ margin: 0, color: '#64748b' }}>
                    No sales follow-ups yet.
                  </p>
                )}
              </div>
            </div>
          )}
        </Modal>

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
          title={
            selectedLead?.status === 'PAYMENT_DONE'
              ? 'Assign Payment Done Lead To Process'
              : 'Assign Lead'
          }
          open={assignModalOpen}
          onCancel={() => setAssignModalOpen(false)}
          onOk={handleAssignLead}
          confirmLoading={assignLoading}
          okText={
            assignType === 'PROCESS' ? 'Assign To Process' : 'Assign To Sales'
          }
        >
          <div style={{ display: 'grid', gap: 14, paddingTop: 10 }}>
            <div>
              <strong>Lead</strong>
              <p style={{ margin: '6px 0 0', color: '#6b7280' }}>
                {selectedLead?.fullName}
              </p>
            </div>

            {selectedLead?.status === 'PAYMENT_DONE' && (
              <div
                style={{
                  background: '#ecfdf5',
                  border: '1px solid #a7f3d0',
                  borderRadius: 14,
                  padding: 12,
                  color: '#047857',
                  fontWeight: 700,
                }}
              >
                Payment is completed. This lead is ready for process team
                assignment.
              </div>
            )}

            <div>
              <strong>Assign To Department</strong>
              <Select
                value={assignType}
                style={{ width: '100%', marginTop: 8 }}
                onChange={(value) => {
                  setAssignType(value);
                  setSelectedEmployeeId(null);
                }}
                options={[
                  { label: 'Sales Executive', value: 'SALES' },
                  { label: 'Process Executive', value: 'PROCESS' },
                ]}
              />
            </div>

            <div>
              <strong>Select Employee</strong>
              <Select
                value={selectedEmployeeId}
                style={{ width: '100%', marginTop: 8 }}
                placeholder="Select employee"
                onChange={(value) => setSelectedEmployeeId(value)}
                options={assignEmployeeOptions.map((employee) => ({
                  label: `${employee.name} - ${employee.email}`,
                  value: employee.id,
                }))}
              />
            </div>
          </div>
        </Modal>

        <Modal
          title="Auto Distribute Bulk Assign"
          open={bulkModalOpen}
          onCancel={() => setBulkModalOpen(false)}
          onOk={handleBulkAssign}
          confirmLoading={bulkLoading}
          okText="Auto Distribute"
        >
          <div style={{ display: 'grid', gap: 14, paddingTop: 10 }}>
            <div>
              <strong>Selected Leads</strong>
              <p style={{ margin: '6px 0 0', color: '#6b7280' }}>
                {selectedLeadIds.length} leads selected. System will distribute
                equally among selected employees.
              </p>
            </div>

            <div>
              <strong>Department</strong>
              <Select
                value={bulkAssignType}
                style={{ width: '100%', marginTop: 8 }}
                onChange={(value) => {
                  setBulkAssignType(value);
                  setBulkEmployeeIds([]);
                }}
                options={[
                  { label: 'Sales Executives', value: 'SALES' },
                  { label: 'Process Executives', value: 'PROCESS' },
                ]}
              />
            </div>

            <div>
              <strong>Select Employees</strong>
              <Select
                mode="multiple"
                value={bulkEmployeeIds}
                style={{ width: '100%', marginTop: 8 }}
                placeholder="Select multiple employees"
                onChange={(value) => setBulkEmployeeIds(value)}
                options={bulkEmployeeOptions.map((employee) => ({
                  label: `${employee.name} - ${employee.email}`,
                  value: employee.id,
                }))}
              />
            </div>
          </div>
        </Modal>
      </div>
    </AdminLayout>
  );
}
