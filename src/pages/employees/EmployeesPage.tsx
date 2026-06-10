import { useEffect, useMemo, useState } from 'react';
import {
  FiBriefcase,
  FiCalendar,
  FiEdit3,
  FiMail,
  FiPhone,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiShield,
  FiUserCheck,
  FiUsers,
} from 'react-icons/fi';
import {
  Button,
  Form,
  Input,
  message,
  Modal,
  Popconfirm,
  Select,
  Switch,
} from 'antd';

import api from '../../api/api';
import AdminLayout from '../../components/layout/AdminLayout';

import styles from './EmployeesPage.module.css';

type EmployeeRole =
  | 'SUPER_ADMIN'
  | 'LEADS_EXECUTIVE'
  | 'SALES_EXECUTIVE'
  | 'PROCESS_EXECUTIVE';

type Employee = {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: EmployeeRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type EmployeeStats = {
  totalEmployees: number;
  leadsTeamCount: number;
  salesTeamCount: number;
  processTeamCount: number;
  activeEmployees: number;
};

type EmployeeFormValues = {
  name: string;
  email: string;
  phone?: string;
  password?: string;
  role: EmployeeRole;
  isActive: boolean;
};

type ResetPasswordValues = {
  newPassword: string;
};

const roleLabels: Record<EmployeeRole, string> = {
  SUPER_ADMIN: 'Super Admin',
  LEADS_EXECUTIVE: 'Leads Executive',
  SALES_EXECUTIVE: 'Sales Executive',
  PROCESS_EXECUTIVE: 'Process Executive',
};

const roleOptions = [
  { label: 'Super Admin', value: 'SUPER_ADMIN' },
  { label: 'Leads Executive', value: 'LEADS_EXECUTIVE' },
  { label: 'Sales Executive', value: 'SALES_EXECUTIVE' },
  { label: 'Process Executive', value: 'PROCESS_EXECUTIVE' },
];

function getDepartment(role: EmployeeRole) {
  if (role === 'SUPER_ADMIN') return 'Management';
  if (role === 'LEADS_EXECUTIVE') return 'Leads Team';
  if (role === 'SALES_EXECUTIVE') return 'Sales Team';
  return 'Process Team';
}

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

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [stats, setStats] = useState<EmployeeStats>({
    totalEmployees: 0,
    leadsTeamCount: 0,
    salesTeamCount: 0,
    processTeamCount: 0,
    activeEmployees: 0,
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  const [employeeModalOpen, setEmployeeModalOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);

  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [resetEmployee, setResetEmployee] = useState<Employee | null>(null);

  const [employeeForm] = Form.useForm<EmployeeFormValues>();
  const [resetForm] = Form.useForm<ResetPasswordValues>();

  const fetchEmployees = async () => {
    try {
      setLoading(true);

      const [employeesResponse, statsResponse] = await Promise.all([
        api.get('/users'),
        api.get('/users/stats'),
      ]);

      setEmployees(employeesResponse.data);
      setStats(statsResponse.data);
    } catch (error) {
      message.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const filteredEmployees = useMemo(() => {
    const keyword = searchTerm.toLowerCase();

    return employees.filter((employee) => {
      return (
        employee.name.toLowerCase().includes(keyword) ||
        employee.email.toLowerCase().includes(keyword) ||
        (employee.phone || '').toLowerCase().includes(keyword) ||
        getDepartment(employee.role).toLowerCase().includes(keyword) ||
        roleLabels[employee.role].toLowerCase().includes(keyword)
      );
    });
  }, [employees, searchTerm]);

  const openCreateModal = () => {
    setEditingEmployee(null);
    employeeForm.resetFields();
    employeeForm.setFieldsValue({
      isActive: true,
      role: 'SALES_EXECUTIVE',
    });
    setEmployeeModalOpen(true);
  };

  const openEditModal = (employee: Employee) => {
    setEditingEmployee(employee);
    employeeForm.setFieldsValue({
      name: employee.name,
      email: employee.email,
      phone: employee.phone,
      role: employee.role,
      isActive: employee.isActive,
    });
    setEmployeeModalOpen(true);
  };

  const handleEmployeeSubmit = async (values: EmployeeFormValues) => {
    try {
      if (editingEmployee) {
        await api.patch(`/users/${editingEmployee.id}`, {
          name: values.name,
          email: values.email,
          phone: values.phone,
          role: values.role,
          isActive: values.isActive,
        });

        message.success('Employee updated successfully');
      } else {
        await api.post('/users', {
          name: values.name,
          email: values.email,
          phone: values.phone,
          password: values.password,
          role: values.role,
          isActive: values.isActive,
        });

        message.success('Employee created successfully');
      }

      setEmployeeModalOpen(false);
      employeeForm.resetFields();
      fetchEmployees();
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Employee save failed');
    }
  };

  const handleStatusChange = async (employee: Employee) => {
    try {
      if (employee.isActive) {
        await api.patch(`/users/${employee.id}/disable`);
        message.success('Employee disabled successfully');
      } else {
        await api.patch(`/users/${employee.id}/enable`);
        message.success('Employee enabled successfully');
      }

      fetchEmployees();
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Status update failed');
    }
  };

  const openResetPasswordModal = (employee: Employee) => {
    setResetEmployee(employee);
    resetForm.resetFields();
    setResetModalOpen(true);
  };

  const handleResetPassword = async (values: ResetPasswordValues) => {
    if (!resetEmployee) return;

    try {
      await api.patch(`/users/${resetEmployee.id}/reset-password`, {
        newPassword: values.newPassword,
      });

      message.success('Password reset successfully');
      setResetModalOpen(false);
      setResetEmployee(null);
      resetForm.resetFields();
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Password reset failed');
    }
  };

  return (
    <AdminLayout
      title="Employee Management"
      subtitle="Manage sales executives, process executives, leads team and admin users."
    >
      <div className={styles.page}>
        <div className={styles.header}>
          <div>
            <span className={styles.kicker}>Employee Management</span>
            <h1>CRM Team Members</h1>
            <p>
              Manage sales executives, process executives, leads team and admin
              users from one place.
            </p>
          </div>

          <button className={styles.addButton} onClick={openCreateModal}>
            <FiPlus />
            Add Employee
          </button>
        </div>

        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <FiUsers />
            </div>
            <div>
              <strong>{stats.totalEmployees}</strong>
              <span>Total Employees</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <FiUserCheck />
            </div>
            <div>
              <strong>{stats.activeEmployees}</strong>
              <span>Active Employees</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <FiBriefcase />
            </div>
            <div>
              <strong>{stats.salesTeamCount}</strong>
              <span>Sales Team</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <FiShield />
            </div>
            <div>
              <strong>{stats.processTeamCount}</strong>
              <span>Process Team</span>
            </div>
          </div>
        </div>

        <div className={styles.panel}>
          <div className={styles.panelTop}>
            <div>
              <h2>Employee Directory</h2>
              <p>Search and manage internal CRM users.</p>
            </div>

            <div className={styles.searchBox}>
              <FiSearch />
              <input
                value={searchTerm}
                placeholder="Search employee, email, role..."
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
          </div>

          <div className={styles.table}>
            <div className={styles.tableHead}>
              <span>Employee</span>
              <span>Contact</span>
              <span>Role</span>
              <span>Joined</span>
              <span>Status</span>
              <span>Actions</span>
            </div>

            {filteredEmployees.map((employee) => (
              <div className={styles.tableRow} key={employee.id}>
                <div className={styles.employeeCell}>
                  <div className={styles.avatar}>
                    {getInitials(employee.name)}
                  </div>

                  <div>
                    <strong>{employee.name}</strong>
                    <small>{getDepartment(employee.role)}</small>
                  </div>
                </div>

                <div className={styles.contactCell}>
                  <span>
                    <FiMail />
                    {employee.email}
                  </span>
                  <span>
                    <FiPhone />
                    {employee.phone || 'Not added'}
                  </span>
                </div>

                <div className={styles.rolePill}>
                  {roleLabels[employee.role]}
                </div>

                <div className={styles.joinedCell}>
                  <FiCalendar />
                  {formatDate(employee.createdAt)}
                </div>

                <div
                  className={
                    employee.isActive
                      ? styles.activeStatus
                      : styles.inactiveStatus
                  }
                >
                  {employee.isActive ? 'ACTIVE' : 'INACTIVE'}
                </div>

                <div className={styles.actionGroup}>
                  <button
                    className={styles.editButton}
                    onClick={() => openEditModal(employee)}
                    title="Edit Employee"
                  >
                    <FiEdit3 />
                  </button>

                  <button
                    className={styles.resetButton}
                    onClick={() => openResetPasswordModal(employee)}
                    title="Reset Password"
                  >
                    <FiRefreshCw />
                  </button>

                  <Popconfirm
                    title={
                      employee.isActive
                        ? 'Disable this employee?'
                        : 'Enable this employee?'
                    }
                    okText="Yes"
                    cancelText="No"
                    onConfirm={() => handleStatusChange(employee)}
                  >
                    <button
                      className={
                        employee.isActive
                          ? styles.disableButton
                          : styles.enableButton
                      }
                    >
                      {employee.isActive ? 'Disable' : 'Enable'}
                    </button>
                  </Popconfirm>
                </div>
              </div>
            ))}

            {!loading && filteredEmployees.length === 0 && (
              <div className={styles.emptyState}>No employees found.</div>
            )}

            {loading && (
              <div className={styles.emptyState}>Loading employees...</div>
            )}
          </div>
        </div>
      </div>

      <Modal
        title={editingEmployee ? 'Edit Employee' : 'Add Employee'}
        open={employeeModalOpen}
        onCancel={() => setEmployeeModalOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <Form
          form={employeeForm}
          layout="vertical"
          onFinish={handleEmployeeSubmit}
        >
          <Form.Item
            label="Name"
            name="name"
            rules={[{ required: true, message: 'Please enter employee name' }]}
          >
            <Input placeholder="Enter employee name" />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: 'Please enter employee email' },
              { type: 'email', message: 'Please enter valid email' },
            ]}
          >
            <Input placeholder="Enter employee email" />
          </Form.Item>

          <Form.Item label="Phone" name="phone">
            <Input placeholder="Enter phone number" />
          </Form.Item>

          {!editingEmployee && (
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
            label="Role"
            name="role"
            rules={[{ required: true, message: 'Please select role' }]}
          >
            <Select options={roleOptions} />
          </Form.Item>

          <Form.Item
            label="Active Status"
            name="isActive"
            valuePropName="checked"
          >
            <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
          </Form.Item>

          <div className={styles.modalActions}>
            <Button onClick={() => setEmployeeModalOpen(false)}>Cancel</Button>

            <Button type="primary" htmlType="submit">
              {editingEmployee ? 'Update Employee' : 'Create Employee'}
            </Button>
          </div>
        </Form>
      </Modal>

      <Modal
        title={`Reset Password${resetEmployee ? ` - ${resetEmployee.name}` : ''}`}
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
