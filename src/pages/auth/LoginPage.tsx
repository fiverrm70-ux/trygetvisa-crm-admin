import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import {
  FiBriefcase,
  FiCheckCircle,
  FiCreditCard,
  FiLock,
  FiMail,
  FiPhoneCall,
  FiShield,
  FiUserCheck,
  FiUsers,
} from 'react-icons/fi';

import api from '../../api/api';
import styles from './LoginPage.module.css';

type LoginRole =
  | 'SUPER_ADMIN'
  | 'LEADS_EXECUTIVE'
  | 'SALES_EXECUTIVE'
  | 'PROCESS_EXECUTIVE'
  | 'CLIENT';

const roles = [
  {
    title: 'Sales Login',
    role: 'SALES_EXECUTIVE' as LoginRole,
    desc: 'Follow-ups, callbacks and payment conversion.',
    icon: <FiPhoneCall />,
    email: 'sales@trygetvisa.com',
  },
  {
    title: 'Process Login',
    role: 'PROCESS_EXECUTIVE' as LoginRole,
    desc: 'Visa files, process stages and completion.',
    icon: <FiBriefcase />,
    email: 'process@trygetvisa.com',
  },
  {
    title: 'Admin Login',
    role: 'SUPER_ADMIN' as LoginRole,
    desc: 'Employees, leads, attendance and reports.',
    icon: <FiShield />,
    email: 'admin@trygetvisa.com',
  },
  {
    title: 'Leads Login',
    role: 'LEADS_EXECUTIVE' as LoginRole,
    desc: 'New enquiries, lead entry and assignment.',
    icon: <FiUsers />,
    email: 'leads@trygetvisa.com',
  },
  {
    title: 'Client Login',
    role: 'CLIENT' as LoginRole,
    desc: 'View application, documents and process updates.',
    icon: <FiUserCheck />,
    email: 'client@trygetvisa.com',
  },
];

export default function LoginPage() {
  const navigate = useNavigate();

  const [selectedRole, setSelectedRole] =
    useState<LoginRole>('PROCESS_EXECUTIVE');

  const defaultRole = roles.find((item) => item.role === 'PROCESS_EXECUTIVE');

  const [email, setEmail] = useState(defaultRole?.email || '');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);

  const selectedRoleData = roles.find((item) => item.role === selectedRole);

  const handleRoleSelect = (role: LoginRole) => {
    const roleData = roles.find((item) => item.role === role);

    setSelectedRole(role);
    setEmail(roleData?.email || '');
    setPassword('admin123');
  };

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      message.error('Please enter email and password');
      return;
    }

    try {
      setLoading(true);

      const response = await api.post('/auth/login', {
        email: cleanEmail,
        password: cleanPassword,
      });

      const { token, user } = response.data;

      if (user.role !== selectedRole) {
        message.error('Selected role does not match this account.');
        return;
      }

      localStorage.setItem('try_get_visa_token', token);
      localStorage.setItem('try_get_visa_user', JSON.stringify(user));

      message.success('Login successful');

      const roleRedirectMap: Record<LoginRole, string> = {
        SUPER_ADMIN: '/dashboard',
        LEADS_EXECUTIVE: '/leads-dashboard',
        SALES_EXECUTIVE: '/sales-dashboard',
        PROCESS_EXECUTIVE: '/process-dashboard',
        CLIENT: '/client-dashboard',
      };

      navigate(roleRedirectMap[user.role as LoginRole]);
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.page}>
      <section className={styles.container}>
        <div className={styles.leftSection}>
          <div className={styles.overlay}></div>

          <div className={styles.logoRow}>
            <span>♛</span>
            <h3>TRY GET VISA CRM</h3>
          </div>

          <div className={styles.heroContent}>
            <h1>
              Premium Visa
              <br />
              Business Management
              <br />
              in <span>One CRM</span>
            </h1>

            <p>
              Manage enquiries, sales follow-ups, payments, visa process files,
              employee activity and client journey from one secure platform.
            </p>
          </div>

          <div className={styles.workflowCard}>
            <span className={styles.workflowTitle}>CRM WORKFLOW</span>

            <div className={styles.workflowSteps}>
              <div className={styles.step}>
                <div className={styles.stepIcon}>
                  <FiUsers />
                </div>
                <strong>Lead</strong>
                <small>New Enquiry</small>
              </div>

              <div className={styles.dashed}></div>

              <div className={styles.step}>
                <div className={styles.stepIcon}>
                  <FiPhoneCall />
                </div>
                <strong>Sales</strong>
                <small>Follow-ups</small>
              </div>

              <div className={styles.dashed}></div>

              <div className={styles.step}>
                <div className={styles.stepIcon}>
                  <FiCreditCard />
                </div>
                <strong>Payment</strong>
                <small>Collection</small>
              </div>

              <div className={styles.dashed}></div>

              <div className={styles.step}>
                <div className={styles.stepIcon}>
                  <FiBriefcase />
                </div>
                <strong>Process</strong>
                <small>Visa Processing</small>
              </div>

              <div className={styles.dashed}></div>

              <div className={styles.step}>
                <div className={styles.stepIcon}>
                  <FiCheckCircle />
                </div>
                <strong>Completion</strong>
                <small>Visa Approved</small>
              </div>
            </div>
          </div>

          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <FiUsers />
              </div>
              <div>
                <strong>128</strong>
                <span>Active Leads</span>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <FiPhoneCall />
              </div>
              <div>
                <strong>24</strong>
                <span>Follow-ups</span>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <FiCreditCard />
              </div>
              <div>
                <strong>9</strong>
                <span>Payments</span>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <FiBriefcase />
              </div>
              <div>
                <strong>18</strong>
                <span>Processing</span>
              </div>
            </div>
          </div>

          <div className={styles.bottomFeatures}>
            <div>
              <FiLock />
              <span>Secure Platform</span>
            </div>

            <div>
              <FiCheckCircle />
              <span>Real-time Tracking</span>
            </div>

            <div>
              <FiUsers />
              <span>Multi User Access</span>
            </div>
          </div>
        </div>

        <div className={styles.rightSection}>
          <div className={styles.topBadge}>
            <div className={styles.shieldCircle}>
              <FiShield />
            </div>
            <span>SECURE ACCESS</span>
          </div>

          <h2>Welcome Back!</h2>

          <p className={styles.subtitle}>
            Select your department role before signing in.
          </p>

          <div className={styles.rolesGrid}>
            {roles.map((item) => (
              <button
                key={item.role}
                type="button"
                className={`${styles.roleCard} ${
                  selectedRole === item.role ? styles.activeRole : ''
                }`}
                onClick={() => handleRoleSelect(item.role)}
              >
                <div className={styles.roleIcon}>{item.icon}</div>

                <div className={styles.roleText}>
                  <strong>{item.title}</strong>
                  <span>{item.desc}</span>
                </div>
              </button>
            ))}
          </div>

          <div className={styles.selectedRoleBox}>
            <div className={styles.selectedLeft}>
              <div className={styles.selectedIcon}>
                {selectedRoleData?.icon}
              </div>

              <div>
                <span>SELECTED ROLE</span>
                <strong>{selectedRoleData?.title}</strong>
              </div>
            </div>

            <p>{selectedRoleData?.desc}</p>
          </div>

          <form className={styles.form} onSubmit={handleLogin}>
            <label>
              Email Address
              <div className={styles.inputWrapper}>
                <FiMail />

                <input
                  type="email"
                  value={email}
                  placeholder="Enter email"
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </label>

            <label>
              Password
              <div className={styles.inputWrapper}>
                <FiLock />

                <input
                  type="password"
                  value={password}
                  placeholder="Enter password"
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </label>

            <button
              type="submit"
              disabled={loading}
              className={styles.loginButton}
            >
              <FiLock />
              {loading ? 'Logging in...' : 'Login to CRM'}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
