import { useEffect, useMemo, useState } from 'react';
import {
  FiCalendar,
  FiEdit3,
  FiMail,
  FiPhone,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiUserCheck,
  FiUsers,
} from 'react-icons/fi';
import { Button, Form, Input, message, Modal, Popconfirm, Switch } from 'antd';

import api from '../../api/api';
import AdminLayout from '../../components/layout/AdminLayout';

import styles from '../employees/EmployeesPage.module.css';

type ClientLead = {
  id: number;
  fullName: string;
  contactNo: string;
  email?: string;
  countryApplying?: string;
  visaType?: string;
  status: string;
  processDoneStatus: string;
};

type Client = {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: 'CLIENT';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  clientLeads?: ClientLead[];
};

type ClientFormValues = {
  name: string;
  email: string;
  phone?: string;
  password?: string;
  isActive: boolean;
};

type ResetPasswordValues = {
  newPassword: string;
};

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);

  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [resetClient, setResetClient] = useState<Client | null>(null);

  const [clientForm] = Form.useForm<ClientFormValues>();
  const [resetForm] = Form.useForm<ResetPasswordValues>();

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await api.get('/clients');
      setClients(response.data);
    } catch (error) {
      message.error('Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const activeClients = clients.filter((client) => client.isActive).length;

  const linkedApplications = clients.reduce((total, client) => {
    return total + (client.clientLeads?.length || 0);
  }, 0);

  const filteredClients = useMemo(() => {
    const keyword = searchTerm.toLowerCase();

    return clients.filter((client) => {
      return (
        client.name.toLowerCase().includes(keyword) ||
        client.email.toLowerCase().includes(keyword) ||
        (client.phone || '').toLowerCase().includes(keyword)
      );
    });
  }, [clients, searchTerm]);

  const openCreateModal = () => {
    setEditingClient(null);
    clientForm.resetFields();
    clientForm.setFieldsValue({
      isActive: true,
    });
    setClientModalOpen(true);
  };

  const openEditModal = (client: Client) => {
    setEditingClient(client);
    clientForm.setFieldsValue({
      name: client.name,
      email: client.email,
      phone: client.phone,
      isActive: client.isActive,
    });
    setClientModalOpen(true);
  };

  const handleClientSubmit = async (values: ClientFormValues) => {
    try {
      if (editingClient) {
        await api.patch(`/clients/${editingClient.id}`, {
          name: values.name,
          email: values.email,
          phone: values.phone,
          isActive: values.isActive,
        });

        message.success('Client updated successfully');
      } else {
        await api.post('/clients', {
          name: values.name,
          email: values.email,
          phone: values.phone,
          password: values.password,
          isActive: values.isActive,
        });

        message.success('Client created successfully');
      }

      setClientModalOpen(false);
      clientForm.resetFields();
      fetchClients();
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Client save failed');
    }
  };

  const handleStatusChange = async (client: Client) => {
    try {
      if (client.isActive) {
        await api.patch(`/clients/${client.id}/disable`);
        message.success('Client disabled successfully');
      } else {
        await api.patch(`/clients/${client.id}/enable`);
        message.success('Client enabled successfully');
      }

      fetchClients();
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Status update failed');
    }
  };

  const openResetPasswordModal = (client: Client) => {
    setResetClient(client);
    resetForm.resetFields();
    setResetModalOpen(true);
  };

  const handleResetPassword = async (values: ResetPasswordValues) => {
    if (!resetClient) return;

    try {
      await api.patch(`/clients/${resetClient.id}/reset-password`, {
        newPassword: values.newPassword,
      });

      message.success('Password reset successfully');
      setResetModalOpen(false);
      setResetClient(null);
      resetForm.resetFields();
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Password reset failed');
    }
  };

  return (
    <AdminLayout
      title="Client Management"
      subtitle="Create client portal accounts and manage visa applicant access."
    >
      <div className={styles.page}>
        <div className={styles.header}>
          <div>
            <span className={styles.kicker}>Client Portal</span>
            <h1>Client Accounts</h1>
            <p>
              Create client login credentials and manage applicants who can view
              their own visa process updates.
            </p>
          </div>

          <button className={styles.addButton} onClick={openCreateModal}>
            <FiPlus />
            Add Client
          </button>
        </div>

        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <FiUsers />
            </div>
            <div>
              <strong>{clients.length}</strong>
              <span>Total Clients</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <FiUserCheck />
            </div>
            <div>
              <strong>{activeClients}</strong>
              <span>Active Clients</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <FiCalendar />
            </div>
            <div>
              <strong>{linkedApplications}</strong>
              <span>Linked Applications</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <FiUsers />
            </div>
            <div>
              <strong>{clients.length - activeClients}</strong>
              <span>Inactive Clients</span>
            </div>
          </div>
        </div>

        <div className={styles.panel}>
          <div className={styles.panelTop}>
            <div>
              <h2>Client Directory</h2>
              <p>Search and manage client portal users.</p>
            </div>

            <div className={styles.searchBox}>
              <FiSearch />
              <input
                value={searchTerm}
                placeholder="Search client, email, phone..."
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
          </div>

          <div className={styles.table}>
            <div className={styles.tableHead}>
              <span>Client</span>
              <span>Contact</span>
              <span>Applications</span>
              <span>Created</span>
              <span>Status</span>
              <span>Actions</span>
            </div>

            {filteredClients.map((client) => (
              <div className={styles.tableRow} key={client.id}>
                <div className={styles.employeeCell}>
                  <div className={styles.avatar}>
                    {getInitials(client.name)}
                  </div>

                  <div>
                    <strong>{client.name}</strong>
                    <small>Visa Applicant</small>
                  </div>
                </div>

                <div className={styles.contactCell}>
                  <span>
                    <FiMail />
                    {client.email}
                  </span>
                  <span>
                    <FiPhone />
                    {client.phone || 'Not added'}
                  </span>
                </div>

                <div className={styles.rolePill}>
                  {client.clientLeads?.length || 0} Linked
                </div>

                <div className={styles.joinedCell}>
                  <FiCalendar />
                  {formatDate(client.createdAt)}
                </div>

                <div
                  className={
                    client.isActive
                      ? styles.activeStatus
                      : styles.inactiveStatus
                  }
                >
                  {client.isActive ? 'ACTIVE' : 'INACTIVE'}
                </div>

                <div className={styles.actionGroup}>
                  <button
                    className={styles.editButton}
                    onClick={() => openEditModal(client)}
                    title="Edit Client"
                  >
                    <FiEdit3 />
                  </button>

                  <button
                    className={styles.resetButton}
                    onClick={() => openResetPasswordModal(client)}
                    title="Reset Password"
                  >
                    <FiRefreshCw />
                  </button>

                  <Popconfirm
                    title={
                      client.isActive
                        ? 'Disable this client?'
                        : 'Enable this client?'
                    }
                    okText="Yes"
                    cancelText="No"
                    onConfirm={() => handleStatusChange(client)}
                  >
                    <button
                      className={
                        client.isActive
                          ? styles.disableButton
                          : styles.enableButton
                      }
                    >
                      {client.isActive ? 'Disable' : 'Enable'}
                    </button>
                  </Popconfirm>
                </div>
              </div>
            ))}

            {!loading && filteredClients.length === 0 && (
              <div className={styles.emptyState}>No clients found.</div>
            )}

            {loading && (
              <div className={styles.emptyState}>Loading clients...</div>
            )}
          </div>
        </div>
      </div>

      <Modal
        title={editingClient ? 'Edit Client' : 'Add Client'}
        open={clientModalOpen}
        onCancel={() => setClientModalOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <Form form={clientForm} layout="vertical" onFinish={handleClientSubmit}>
          <Form.Item
            label="Name"
            name="name"
            rules={[{ required: true, message: 'Please enter client name' }]}
          >
            <Input placeholder="Enter client name" />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: 'Please enter client email' },
              { type: 'email', message: 'Please enter valid email' },
            ]}
          >
            <Input placeholder="Enter client email" />
          </Form.Item>

          <Form.Item label="Phone" name="phone">
            <Input placeholder="Enter phone number" />
          </Form.Item>

          {!editingClient && (
            <Form.Item
              label="Password"
              name="password"
              rules={[
                { required: true, message: 'Please enter password' },
                { min: 6, message: 'Password must be minimum 6 characters' },
              ]}
            >
              <Input.Password placeholder="Enter login password" />
            </Form.Item>
          )}

          <Form.Item
            label="Active Status"
            name="isActive"
            valuePropName="checked"
          >
            <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
          </Form.Item>

          <div className={styles.modalActions}>
            <Button onClick={() => setClientModalOpen(false)}>Cancel</Button>

            <Button type="primary" htmlType="submit">
              {editingClient ? 'Update Client' : 'Create Client'}
            </Button>
          </div>
        </Form>
      </Modal>

      <Modal
        title={`Reset Password${resetClient ? ` - ${resetClient.name}` : ''}`}
        open={resetModalOpen}
        onCancel={() => setResetModalOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <Form form={resetForm} layout="vertical" onFinish={handleResetPassword}>
          <Form.Item
            label="New Password"
            name="newPassword"
            rules={[
              { required: true, message: 'Please enter new password' },
              { min: 6, message: 'Password must be minimum 6 characters' },
            ]}
          >
            <Input.Password placeholder="Enter new password" />
          </Form.Item>

          <div className={styles.modalActions}>
            <Button onClick={() => setResetModalOpen(false)}>Cancel</Button>

            <Button type="primary" htmlType="submit">
              Reset Password
            </Button>
          </div>
        </Form>
      </Modal>
    </AdminLayout>
  );
}
