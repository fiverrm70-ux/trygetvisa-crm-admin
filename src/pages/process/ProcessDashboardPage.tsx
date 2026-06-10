import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent } from 'react';
import {
  FiEye,
  FiExternalLink,
  FiFileText,
  FiMail,
  FiMapPin,
  FiPhone,
  FiRefreshCw,
  FiSearch,
  FiUpload,
  FiUser,
} from 'react-icons/fi';
import { Input, message, Modal, Select } from 'antd';

import api from '../../api/api';
import AttendanceActions from '../../components/attendance/AttendanceActions';
import AdminLayout from '../../components/layout/AdminLayout';

import styles from './ProcessDashboardPage.module.css';

const { TextArea } = Input;

const DOCUMENTS = ['10TH', '12TH', 'BACHELOR DEGREE', 'MASTER DEGREE', 'PHD'];
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  'https://trygetvisa-crm-api.onrender.com';

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
};

type ProcessDocument = {
  id: number;
  documentName: string;
  fileUrl?: string | null;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  remarks?: string | null;
};

type Lead = {
  id: number;
  fullName: string;
  contactNo: string;
  email?: string | null;
  city?: string | null;
  countryApplying?: string | null;
  visaType?: string | null;
  processDoneStatus?: 'PENDING' | 'YES' | 'NO';
  status: string;
  assignedToSales?: User | null;
  processDocuments?: ProcessDocument[];
  processUpdateHistories?: {
    id: number;
    status: string;
    processDoneStatus: string;
    notes?: string | null;
    createdAt: string;
    processUser?: User | null;
  }[];
};

type ProcessFilter =
  | 'ALL'
  | 'ASSIGNED_TO_PROCESS'
  | 'PROCESS_RUNNING'
  | 'PROCESS_COMPLETED';

type DocumentState = {
  documentName: string;
  fileUrl: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  remarks: string;
  uploading: boolean;
};

type PreviewDocument = {
  documentName: string;
  fileUrl: string;
} | null;

export default function ProcessDashboardPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<ProcessFilter>('ALL');

  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  const [processLead, setProcessLead] = useState<Lead | null>(null);

  const [processStatus, setProcessStatus] = useState<
    'ASSIGNED_TO_PROCESS' | 'PROCESS_RUNNING' | 'PROCESS_COMPLETED'
  >('PROCESS_RUNNING');

  const [processDoneStatus, setProcessDoneStatus] = useState<
    'PENDING' | 'YES' | 'NO'
  >('PENDING');

  const [processNotes, setProcessNotes] = useState('');

  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);

  const [documents, setDocuments] = useState<DocumentState[]>([]);
  const [previewDocument, setPreviewDocument] = useState<PreviewDocument>(null);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const response = await api.get<Lead[]>('/leads');
      setLeads(response.data);
    } catch (error: any) {
      message.error(
        error?.response?.data?.message || 'Failed to fetch process leads',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const counts = useMemo(() => {
    return {
      total: leads.length,
      assigned: leads.filter((lead) => lead.status === 'ASSIGNED_TO_PROCESS')
        .length,
      running: leads.filter((lead) => lead.status === 'PROCESS_RUNNING').length,
      completed: leads.filter((lead) => lead.status === 'PROCESS_COMPLETED')
        .length,
    };
  }, [leads]);

  const filteredLeads = useMemo(() => {
    const keyword = searchTerm.toLowerCase().trim();

    let list = leads;

    if (activeFilter !== 'ALL') {
      list = list.filter((lead) => lead.status === activeFilter);
    }

    if (!keyword) return list;

    return list.filter((lead) => {
      return (
        lead.fullName?.toLowerCase().includes(keyword) ||
        lead.contactNo?.toLowerCase().includes(keyword) ||
        lead.email?.toLowerCase().includes(keyword)
      );
    });
  }, [leads, searchTerm, activeFilter]);

  const openViewModal = (lead: Lead) => {
    setSelectedLead(lead);
    setViewModalOpen(true);
  };

  const openUpdateModal = (lead: Lead) => {
    setProcessLead(lead);

    setProcessStatus(
      lead.status === 'PROCESS_COMPLETED'
        ? 'PROCESS_COMPLETED'
        : lead.status === 'PROCESS_RUNNING'
          ? 'PROCESS_RUNNING'
          : 'PROCESS_RUNNING',
    );

    setProcessDoneStatus(lead.processDoneStatus || 'PENDING');
    setProcessNotes('');

    const existingDocs = DOCUMENTS.map((docName) => {
      const existing = lead.processDocuments?.find(
        (doc) => doc.documentName === docName,
      );

      return {
        documentName: docName,
        fileUrl: existing?.fileUrl || '',
        status: existing?.status || 'PENDING',
        remarks: existing?.remarks || '',
        uploading: false,
      };
    });

    setDocuments(existingDocs);
    setUpdateModalOpen(true);
  };

  const updateDocumentField = (
    documentName: string,
    field: keyof Omit<DocumentState, 'documentName'>,
    value: string | boolean,
  ) => {
    setDocuments((current) =>
      current.map((doc) =>
        doc.documentName === documentName
          ? {
              ...doc,
              [field]: value,
            }
          : doc,
      ),
    );
  };

  const handleFileUpload = async (
    event: ChangeEvent<HTMLInputElement>,
    documentName: string,
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!processLead?.id) {
      message.error('Please open a valid process lead first');
      return;
    }

    const currentDocument = documents.find(
      (document) => document.documentName === documentName,
    );

    const formData = new FormData();
    formData.append('file', file);

    try {
      updateDocumentField(documentName, 'uploading', true);

      const uploadResponse = await api.post(
        '/leads/upload-document',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      );

      const uploadedFileUrl = uploadResponse.data.fileUrl;

      updateDocumentField(documentName, 'fileUrl', uploadedFileUrl);

      await api.post(`/leads/${processLead.id}/process-document`, {
        documentName,
        fileUrl: uploadedFileUrl,
        status: currentDocument?.status || 'PENDING',
        remarks: currentDocument?.remarks || '',
      });

      message.success(`${documentName} uploaded and saved successfully`);

      fetchLeads();
    } catch (error: any) {
      message.error(
        error?.response?.data?.message || `${documentName} upload failed`,
      );
    } finally {
      updateDocumentField(documentName, 'uploading', false);
      event.target.value = '';
    }
  };

  const handleProcessUpdate = async () => {
    if (!processLead) return;

    if (!processNotes.trim()) {
      message.error('Please enter process notes');
      return;
    }

    try {
      setUpdateLoading(true);

      for (const document of documents) {
        await api.post(`/leads/${processLead.id}/process-document`, {
          documentName: document.documentName,
          fileUrl: document.fileUrl,
          status: document.status,
          remarks: document.remarks,
        });
      }

      await api.post(`/leads/${processLead.id}/process-update`, {
        status:
          processDoneStatus === 'YES' ? 'PROCESS_COMPLETED' : processStatus,
        processDoneStatus,
        notes: processNotes,
      });

      message.success(
        processDoneStatus === 'YES'
          ? 'Process completed successfully'
          : 'Process updated successfully',
      );

      setUpdateModalOpen(false);
      fetchLeads();
    } catch (error: any) {
      message.error(
        error?.response?.data?.message || 'Failed to update process',
      );
    } finally {
      setUpdateLoading(false);
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      ASSIGNED_TO_PROCESS: 'Assigned To Process',
      PROCESS_RUNNING: 'Process Running',
      PROCESS_COMPLETED: 'Process Completed',
    };

    return labels[status] || status;
  };

  const getFileName = (fileUrl: string) => {
    if (!fileUrl) return 'No file uploaded';
    return fileUrl.split('/').pop() || 'Uploaded file';
  };

  const getFullFileUrl = (fileUrl: string) => {
    if (fileUrl.startsWith('http')) return fileUrl;
    return `${API_BASE_URL}${fileUrl}`;
  };

  const isImageFile = (fileUrl: string) => {
    return /\.(jpg|jpeg|png|webp)$/i.test(fileUrl);
  };

  const isPdfFile = (fileUrl: string) => {
    return /\.pdf$/i.test(fileUrl);
  };

  return (
    <AdminLayout
      title="Process Dashboard"
      subtitle="Manage visa processing workflow and documents."
    >
      <div className={styles.page}>
        <AttendanceActions />

        <div className={styles.hero}>
          <div>
            <span className={styles.kicker}>Process Executive</span>
            <h1>Visa Processing Workspace</h1>
            <p>
              Upload documents, accept/reject files, update process notes and
              complete visa processing workflow.
            </p>
          </div>

          <button className={styles.refreshButton} onClick={fetchLeads}>
            <FiRefreshCw />
            Refresh
          </button>
        </div>

        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <strong>{counts.total}</strong>
            <span>Total Leads</span>
          </div>

          <div className={styles.statCard}>
            <strong>{counts.assigned}</strong>
            <span>New Assigned</span>
          </div>

          <div className={styles.statCard}>
            <strong>{counts.running}</strong>
            <span>Processing</span>
          </div>

          <div className={styles.statCard}>
            <strong>{counts.completed}</strong>
            <span>Completed</span>
          </div>
        </div>

        <div className={styles.panel}>
          <div className={styles.panelTop}>
            <div>
              <h2>Assigned Leads</h2>
              <p>
                Process department can manage documents, remarks and completion
                status.
              </p>
            </div>

            <div className={styles.searchBox}>
              <FiSearch />
              <input
                value={searchTerm}
                placeholder="Search applicant..."
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
          </div>

          <div className={styles.filterTabs}>
            {[
              { key: 'ALL', label: 'All', count: counts.total },
              {
                key: 'ASSIGNED_TO_PROCESS',
                label: 'Assigned',
                count: counts.assigned,
              },
              {
                key: 'PROCESS_RUNNING',
                label: 'Running',
                count: counts.running,
              },
              {
                key: 'PROCESS_COMPLETED',
                label: 'Completed',
                count: counts.completed,
              },
            ].map((filter) => (
              <button
                key={filter.key}
                type="button"
                className={`${styles.filterTab} ${
                  activeFilter === filter.key ? styles.activeFilterTab : ''
                }`}
                onClick={() =>
                  setActiveFilter((current) =>
                    current === filter.key
                      ? 'ALL'
                      : (filter.key as ProcessFilter),
                  )
                }
              >
                {filter.label}
                <span>{filter.count}</span>
              </button>
            ))}
          </div>

          <div className={styles.table}>
            <div className={styles.tableHead}>
              <span>Applicant</span>
              <span>Contact</span>
              <span>Country</span>
              <span>Sales</span>
              <span>Status</span>
              <span>Process Done</span>
              <span>Action</span>
            </div>

            {loading ? (
              <div className={styles.emptyState}>Loading process leads...</div>
            ) : filteredLeads.length === 0 ? (
              <div className={styles.emptyState}>No process leads found.</div>
            ) : (
              filteredLeads.map((lead) => (
                <div className={styles.tableRow} key={lead.id}>
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

                  <div className={styles.countryCell}>
                    {lead.countryApplying || 'Not selected'}
                  </div>

                  <div className={styles.salesCell}>
                    <strong>
                      {lead.assignedToSales?.name || 'Not assigned'}
                    </strong>
                  </div>

                  <div className={styles.statusPill}>
                    {getStatusLabel(lead.status)}
                  </div>

                  <div
                    className={`${styles.donePill} ${
                      lead.processDoneStatus === 'YES'
                        ? styles.doneYes
                        : lead.processDoneStatus === 'NO'
                          ? styles.doneNo
                          : styles.donePending
                    }`}
                  >
                    {lead.processDoneStatus || 'PENDING'}
                  </div>

                  <div className={styles.actionCell}>
                    <button
                      className={styles.iconButton}
                      type="button"
                      onClick={() => openViewModal(lead)}
                    >
                      <FiEye />
                    </button>

                    <button
                      className={styles.updateButton}
                      type="button"
                      onClick={() => openUpdateModal(lead)}
                    >
                      Update
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <Modal
          title="Applicant Details"
          open={viewModalOpen}
          onCancel={() => setViewModalOpen(false)}
          footer={null}
          width={760}
        >
          {selectedLead && (
            <div className={styles.detailGrid}>
              <div className={styles.detailCard}>
                <span>Applicant</span>
                <strong>{selectedLead.fullName}</strong>
              </div>

              <div className={styles.detailCard}>
                <span>Phone</span>
                <strong>{selectedLead.contactNo}</strong>
              </div>

              <div className={styles.detailCard}>
                <span>Email</span>
                <strong>{selectedLead.email || 'Not added'}</strong>
              </div>

              <div className={styles.detailCard}>
                <span>Visa Type</span>
                <strong>{selectedLead.visaType || 'Not selected'}</strong>
              </div>

              <div className={styles.notesCard}>
                <span>Process History</span>

                {selectedLead.processUpdateHistories &&
                selectedLead.processUpdateHistories.length > 0 ? (
                  <div className={styles.timeline}>
                    {selectedLead.processUpdateHistories.map((item) => (
                      <div className={styles.timelineItem} key={item.id}>
                        <strong>{getStatusLabel(item.status)}</strong>
                        <p>{item.notes}</p>
                        <small>
                          {item.processUser?.name} •{' '}
                          {new Date(item.createdAt).toLocaleString('en-IN')}
                        </small>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>No process updates yet.</p>
                )}
              </div>
            </div>
          )}
        </Modal>

        <Modal
          title="Update Process Workflow"
          open={updateModalOpen}
          onCancel={() => setUpdateModalOpen(false)}
          onOk={handleProcessUpdate}
          confirmLoading={updateLoading}
          width={980}
          okText="Save Process Update"
        >
          <div className={styles.modalBody}>
            <div>
              <strong>Lead</strong>
              <p>
                {processLead?.fullName} • {processLead?.contactNo}
              </p>
            </div>

            <div className={styles.documentsSection}>
              <h3>Documents Verification</h3>

              {documents.map((document) => (
                <div className={styles.documentRow} key={document.documentName}>
                  <div className={styles.documentTitle}>
                    <FiFileText />
                    {document.documentName}
                  </div>

                  <div className={styles.uploadBox}>
                    <label className={styles.uploadButton}>
                      <FiUpload />
                      {document.uploading ? 'Uploading...' : 'Upload File'}
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                        disabled={document.uploading}
                        onChange={(event) =>
                          handleFileUpload(event, document.documentName)
                        }
                      />
                    </label>

                    <span className={styles.fileName}>
                      {getFileName(document.fileUrl)}
                    </span>

                    {document.fileUrl && (
                      <button
                        type="button"
                        className={styles.viewFileButton}
                        onClick={() =>
                          setPreviewDocument({
                            documentName: document.documentName,
                            fileUrl: document.fileUrl,
                          })
                        }
                      >
                        View
                      </button>
                    )}
                  </div>

                  <Select
                    value={document.status}
                    style={{ width: 150 }}
                    onChange={(value) =>
                      updateDocumentField(
                        document.documentName,
                        'status',
                        value,
                      )
                    }
                    options={[
                      { label: 'Pending', value: 'PENDING' },
                      { label: 'Accepted', value: 'ACCEPTED' },
                      { label: 'Rejected', value: 'REJECTED' },
                    ]}
                  />

                  <Input
                    placeholder="Remarks"
                    value={document.remarks}
                    onChange={(event) =>
                      updateDocumentField(
                        document.documentName,
                        'remarks',
                        event.target.value,
                      )
                    }
                  />
                </div>
              ))}
            </div>

            <div className={styles.statusGrid}>
              <div>
                <strong>Process Status</strong>
                <Select
                  value={processStatus}
                  className={styles.fullSelect}
                  onChange={(value) => setProcessStatus(value)}
                  options={[
                    {
                      label: 'Assigned To Process',
                      value: 'ASSIGNED_TO_PROCESS',
                    },
                    {
                      label: 'Process Running',
                      value: 'PROCESS_RUNNING',
                    },
                    {
                      label: 'Process Completed',
                      value: 'PROCESS_COMPLETED',
                    },
                  ]}
                />
              </div>

              <div>
                <strong>Process Done</strong>
                <Select
                  value={processDoneStatus}
                  className={styles.fullSelect}
                  onChange={(value) => setProcessDoneStatus(value)}
                  options={[
                    { label: 'Pending', value: 'PENDING' },
                    { label: 'Yes', value: 'YES' },
                    { label: 'No', value: 'NO' },
                  ]}
                />
              </div>
            </div>

            <div>
              <strong>Process Notes</strong>
              <TextArea
                value={processNotes}
                rows={5}
                className={styles.notesInput}
                placeholder="Enter embassy update, file status, missing documents, process remarks..."
                onChange={(event) => setProcessNotes(event.target.value)}
              />
            </div>
          </div>
        </Modal>

        <Modal
          title={previewDocument?.documentName || 'Document Preview'}
          open={!!previewDocument}
          onCancel={() => setPreviewDocument(null)}
          footer={null}
          width={900}
        >
          {previewDocument && (
            <div className={styles.previewBox}>
              {isImageFile(previewDocument.fileUrl) && (
                <img
                  className={styles.previewImage}
                  src={getFullFileUrl(previewDocument.fileUrl)}
                  alt={previewDocument.documentName}
                />
              )}

              {isPdfFile(previewDocument.fileUrl) && (
                <iframe
                  className={styles.previewFrame}
                  src={getFullFileUrl(previewDocument.fileUrl)}
                  title={previewDocument.documentName}
                />
              )}

              {!isImageFile(previewDocument.fileUrl) &&
                !isPdfFile(previewDocument.fileUrl) && (
                  <div className={styles.previewFallback}>
                    <FiFileText />
                    <h3>Preview not available for this file type</h3>
                    <p>{getFileName(previewDocument.fileUrl)}</p>
                    <button
                      type="button"
                      className={styles.openFileButton}
                      onClick={() =>
                        window.open(
                          getFullFileUrl(previewDocument.fileUrl),
                          '_blank',
                        )
                      }
                    >
                      <FiExternalLink />
                      Open Document
                    </button>
                  </div>
                )}
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}
