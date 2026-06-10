import { useEffect, useMemo, useState } from 'react';
import {
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiEdit3,
  FiPlus,
  FiRefreshCw,
  FiTrash2,
} from 'react-icons/fi';
import {
  Button,
  DatePicker,
  Form,
  Input,
  message,
  Modal,
  Popconfirm,
  Select,
  Switch,
} from 'antd';
import dayjs from 'dayjs';

import api from '../../api/api';
import AdminLayout from '../../components/layout/AdminLayout';

import styles from '../employees/EmployeesPage.module.css';

type Holiday = {
  id: number;
  title: string;
  date: string;
  description?: string;
  year: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type HolidayFormValues = {
  title: string;
  date: any;
  description?: string;
  isActive: boolean;
};

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    weekday: 'short',
  });
}

function getCurrentYear() {
  return new Date().getFullYear();
}

function getMonthName(monthIndex: number) {
  return new Date(2026, monthIndex, 1).toLocaleDateString('en-IN', {
    month: 'long',
  });
}

function toDateKey(date: Date | string) {
  const dateObject = new Date(date);
  const year = dateObject.getFullYear();
  const month = String(dateObject.getMonth() + 1).padStart(2, '0');
  const day = String(dateObject.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

const yearOptions = Array.from({ length: 7 }).map((_, index) => {
  const year = getCurrentYear() - 1 + index;

  return {
    label: String(year),
    value: year,
  };
});

const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function HolidayCalendarPage() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [selectedYear, setSelectedYear] = useState(getCurrentYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [loading, setLoading] = useState(false);

  const [holidayModalOpen, setHolidayModalOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);

  const [holidayForm] = Form.useForm<HolidayFormValues>();

  const storedUser = localStorage.getItem('try_get_visa_user');
  const user = storedUser ? JSON.parse(storedUser) : null;
  const isAdmin = user?.role === 'SUPER_ADMIN';

  const fetchHolidays = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/holidays/${selectedYear}`);
      setHolidays(response.data);
    } catch (error) {
      message.error('Failed to load holidays');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHolidays();
  }, [selectedYear]);

  const activeHolidays = holidays.filter((holiday) => holiday.isActive).length;

  const upcomingHolidayItems = useMemo(() => {
    const today = new Date();

    return holidays
      .filter((holiday) => holiday.isActive && new Date(holiday.date) >= today)
      .sort(
        (first, second) =>
          new Date(first.date).getTime() - new Date(second.date).getTime(),
      );
  }, [holidays]);

  const upcomingHolidays = upcomingHolidayItems.length;

  const monthHolidays = useMemo(() => {
    return holidays.filter((holiday) => {
      const date = new Date(holiday.date);
      return holiday.isActive && date.getMonth() === selectedMonth;
    });
  }, [holidays, selectedMonth]);

  const holidayByDate = useMemo(() => {
    const map = new Map<string, Holiday>();

    holidays.forEach((holiday) => {
      if (holiday.isActive) {
        map.set(toDateKey(holiday.date), holiday);
      }
    });

    return map;
  }, [holidays]);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(selectedYear, selectedMonth, 1);
    const lastDay = new Date(selectedYear, selectedMonth + 1, 0);
    const firstWeekDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    const totalDays = lastDay.getDate();

    const days: Array<{
      day: number | null;
      date?: Date;
      dateKey?: string;
      isSunday?: boolean;
      isToday?: boolean;
      holiday?: Holiday;
    }> = [];

    for (let index = 0; index < firstWeekDay; index += 1) {
      days.push({ day: null });
    }

    for (let day = 1; day <= totalDays; day += 1) {
      const date = new Date(selectedYear, selectedMonth, day);
      const dateKey = toDateKey(date);

      days.push({
        day,
        date,
        dateKey,
        isSunday: date.getDay() === 0,
        isToday: toDateKey(new Date()) === dateKey,
        holiday: holidayByDate.get(dateKey),
      });
    }

    return days;
  }, [holidayByDate, selectedMonth, selectedYear]);

  const openCreateModal = () => {
    setEditingHoliday(null);
    holidayForm.resetFields();
    holidayForm.setFieldsValue({
      isActive: true,
      date: dayjs(
        `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-01`,
      ),
    });
    setHolidayModalOpen(true);
  };

  const openEditModal = (holiday: Holiday) => {
    setEditingHoliday(holiday);
    holidayForm.setFieldsValue({
      title: holiday.title,
      date: dayjs(holiday.date),
      description: holiday.description,
      isActive: holiday.isActive,
    });
    setHolidayModalOpen(true);
  };

  const goPreviousMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear((year) => year - 1);
      return;
    }

    setSelectedMonth((month) => month - 1);
  };

  const goNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear((year) => year + 1);
      return;
    }

    setSelectedMonth((month) => month + 1);
  };

  const handleHolidaySubmit = async (values: HolidayFormValues) => {
    try {
      const payload = {
        title: values.title,
        date: values.date.format('YYYY-MM-DD'),
        description: values.description,
        isActive: values.isActive,
      };

      if (editingHoliday) {
        await api.patch(`/holidays/${editingHoliday.id}`, payload);
        message.success('Holiday updated successfully');
      } else {
        await api.post('/holidays', payload);
        message.success('Holiday created successfully');
      }

      setHolidayModalOpen(false);
      holidayForm.resetFields();
      fetchHolidays();
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Holiday save failed');
    }
  };

  const handleDeleteHoliday = async (holiday: Holiday) => {
    try {
      await api.delete(`/holidays/${holiday.id}`);
      message.success('Holiday deleted successfully');
      fetchHolidays();
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Holiday delete failed');
    }
  };

  return (
    <AdminLayout
      title="Holiday Calendar"
      subtitle="View yearly holidays for admin, leads, sales, process team and clients."
    >
      <div className={styles.page}>
        <div className={styles.header}>
          <div>
            <span className={styles.kicker}>Yearly Holidays</span>
            <h1>Holiday Calendar</h1>
            <p>
              Admin can manage holidays. Team members and clients can view the
              official holiday calendar.
            </p>
          </div>

          {isAdmin && (
            <button className={styles.addButton} onClick={openCreateModal}>
              <FiPlus />
              Add Holiday
            </button>
          )}
        </div>

        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <FiCalendar />
            </div>
            <div>
              <strong>{selectedYear}</strong>
              <span>Selected Year</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <FiCalendar />
            </div>
            <div>
              <strong>{holidays.length}</strong>
              <span>Total Holidays</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <FiRefreshCw />
            </div>
            <div>
              <strong>{activeHolidays}</strong>
              <span>Active Holidays</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <FiCalendar />
            </div>
            <div>
              <strong>{upcomingHolidays}</strong>
              <span>Upcoming Holidays</span>
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) 360px',
            gap: 20,
            alignItems: 'start',
          }}
        >
          <div className={styles.panel}>
            <div className={styles.panelTop}>
              <div>
                <h2>{selectedYear} Holidays</h2>
                <p>Official company holiday list.</p>
              </div>

              <div className={styles.searchBox}>
                <FiCalendar />
                <Select
                  value={selectedYear}
                  onChange={setSelectedYear}
                  options={yearOptions}
                  style={{ width: 140 }}
                />
              </div>
            </div>

            <div className={styles.table}>
              <div className={styles.tableHead}>
                <span>Holiday</span>
                <span>Date</span>
                <span>Description</span>
                <span>Year</span>
                <span>Status</span>
                <span>Actions</span>
              </div>

              {holidays.map((holiday) => (
                <div className={styles.tableRow} key={holiday.id}>
                  <div className={styles.employeeCell}>
                    <div className={styles.avatar}>
                      <FiCalendar />
                    </div>

                    <div>
                      <strong>{holiday.title}</strong>
                      <small>Official Holiday</small>
                    </div>
                  </div>

                  <div className={styles.joinedCell}>
                    <FiCalendar />
                    {formatDate(holiday.date)}
                  </div>

                  <div className={styles.contactCell}>
                    <span>{holiday.description || 'No description added'}</span>
                  </div>

                  <div className={styles.rolePill}>{holiday.year}</div>

                  <div
                    className={
                      holiday.isActive
                        ? styles.activeStatus
                        : styles.inactiveStatus
                    }
                  >
                    {holiday.isActive ? 'ACTIVE' : 'INACTIVE'}
                  </div>

                  <div className={styles.actionGroup}>
                    {isAdmin ? (
                      <>
                        <button
                          className={styles.editButton}
                          onClick={() => openEditModal(holiday)}
                          title="Edit Holiday"
                        >
                          <FiEdit3 />
                        </button>

                        <Popconfirm
                          title="Delete this holiday?"
                          okText="Yes"
                          cancelText="No"
                          onConfirm={() => handleDeleteHoliday(holiday)}
                        >
                          <button
                            className={styles.disableButton}
                            title="Delete Holiday"
                          >
                            <FiTrash2 />
                          </button>
                        </Popconfirm>
                      </>
                    ) : (
                      <span className={styles.rolePill}>View Only</span>
                    )}
                  </div>
                </div>
              ))}

              {!loading && holidays.length === 0 && (
                <div className={styles.emptyState}>No holidays found.</div>
              )}

              {loading && (
                <div className={styles.emptyState}>Loading holidays...</div>
              )}
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gap: 16,
              position: 'sticky',
              top: 18,
            }}
          >
            <div
              style={{
                background:
                  'linear-gradient(135deg, rgba(255,255,255,0.98), rgba(248,250,252,0.96))',
                border: '1px solid rgba(15, 23, 42, 0.08)',
                borderRadius: 24,
                padding: 18,
                boxShadow: '0 18px 40px rgba(15, 23, 42, 0.10)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 16,
                }}
              >
                <button
                  type="button"
                  onClick={goPreviousMonth}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 12,
                    border: '1px solid rgba(15, 23, 42, 0.10)',
                    background: '#fff',
                    cursor: 'pointer',
                    display: 'grid',
                    placeItems: 'center',
                  }}
                >
                  <FiChevronLeft />
                </button>

                <div style={{ textAlign: 'center' }}>
                  <strong
                    style={{
                      display: 'block',
                      fontSize: 16,
                      color: '#0f172a',
                    }}
                  >
                    {getMonthName(selectedMonth)} {selectedYear}
                  </strong>
                  <span style={{ color: '#64748b', fontSize: 12 }}>
                    Calendar Widget
                  </span>
                </div>

                <button
                  type="button"
                  onClick={goNextMonth}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 12,
                    border: '1px solid rgba(15, 23, 42, 0.10)',
                    background: '#fff',
                    cursor: 'pointer',
                    display: 'grid',
                    placeItems: 'center',
                  }}
                >
                  <FiChevronRight />
                </button>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  gap: 7,
                  marginBottom: 8,
                }}
              >
                {weekDays.map((day) => (
                  <div
                    key={day}
                    style={{
                      textAlign: 'center',
                      fontSize: 11,
                      color: '#64748b',
                      fontWeight: 700,
                    }}
                  >
                    {day}
                  </div>
                ))}
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  gap: 7,
                }}
              >
                {calendarDays.map((day, index) => {
                  if (!day.day) {
                    return <div key={`empty-${index}`} />;
                  }

                  const isHoliday = Boolean(day.holiday);

                  return (
                    <div
                      key={day.dateKey}
                      title={day.holiday?.title || ''}
                      style={{
                        minHeight: 42,
                        borderRadius: 14,
                        border: day.isToday
                          ? '2px solid #2563eb'
                          : isHoliday
                            ? '1px solid rgba(34, 197, 94, 0.55)'
                            : '1px solid rgba(15, 23, 42, 0.08)',
                        background: isHoliday
                          ? 'linear-gradient(135deg, #dcfce7, #fef9c3)'
                          : day.isSunday
                            ? '#fff1f2'
                            : '#ffffff',
                        color: isHoliday
                          ? '#166534'
                          : day.isSunday
                            ? '#be123c'
                            : '#0f172a',
                        display: 'grid',
                        placeItems: 'center',
                        fontWeight: 800,
                        fontSize: 13,
                        position: 'relative',
                      }}
                    >
                      {day.day}

                      {isHoliday && (
                        <span
                          style={{
                            position: 'absolute',
                            bottom: 5,
                            width: 5,
                            height: 5,
                            borderRadius: 999,
                            background: '#16a34a',
                          }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: 12,
                  flexWrap: 'wrap',
                  marginTop: 14,
                  color: '#64748b',
                  fontSize: 12,
                }}
              >
                <span>🟢 Holiday</span>
                <span>🌸 Sunday</span>
                <span>🔵 Today</span>
              </div>
            </div>

            <div
              style={{
                background: '#ffffff',
                border: '1px solid rgba(15, 23, 42, 0.08)',
                borderRadius: 24,
                padding: 18,
                boxShadow: '0 18px 40px rgba(15, 23, 42, 0.08)',
              }}
            >
              <h3 style={{ margin: '0 0 6px', color: '#0f172a' }}>
                Upcoming Holidays
              </h3>
              <p style={{ margin: '0 0 14px', color: '#64748b' }}>
                Next active holidays for {selectedYear}.
              </p>

              <div style={{ display: 'grid', gap: 10 }}>
                {upcomingHolidayItems.slice(0, 5).map((holiday) => (
                  <div
                    key={holiday.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '48px 1fr',
                      gap: 12,
                      alignItems: 'center',
                      padding: 12,
                      borderRadius: 16,
                      background: '#f8fafc',
                      border: '1px solid rgba(15, 23, 42, 0.06)',
                    }}
                  >
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 16,
                        background: 'linear-gradient(135deg, #dcfce7, #fef9c3)',
                        color: '#166534',
                        display: 'grid',
                        placeItems: 'center',
                        fontWeight: 900,
                      }}
                    >
                      {new Date(holiday.date).getDate()}
                    </div>

                    <div>
                      <strong style={{ display: 'block', color: '#0f172a' }}>
                        {holiday.title}
                      </strong>
                      <small style={{ color: '#64748b' }}>
                        {formatDate(holiday.date)}
                      </small>
                    </div>
                  </div>
                ))}

                {upcomingHolidayItems.length === 0 && (
                  <div className={styles.emptyState}>
                    No upcoming holidays found.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal
        title={editingHoliday ? 'Edit Holiday' : 'Add Holiday'}
        open={holidayModalOpen}
        onCancel={() => setHolidayModalOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <Form
          form={holidayForm}
          layout="vertical"
          onFinish={handleHolidaySubmit}
        >
          <Form.Item
            label="Holiday Title"
            name="title"
            rules={[{ required: true, message: 'Please enter holiday title' }]}
          >
            <Input placeholder="Example: Independence Day" />
          </Form.Item>

          <Form.Item
            label="Holiday Date"
            name="date"
            rules={[{ required: true, message: 'Please select holiday date' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label="Description" name="description">
            <Input.TextArea rows={3} placeholder="Example: National Holiday" />
          </Form.Item>

          <Form.Item
            label="Active Status"
            name="isActive"
            valuePropName="checked"
          >
            <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
          </Form.Item>

          <div className={styles.modalActions}>
            <Button onClick={() => setHolidayModalOpen(false)}>Cancel</Button>

            <Button type="primary" htmlType="submit">
              {editingHoliday ? 'Update Holiday' : 'Create Holiday'}
            </Button>
          </div>
        </Form>
      </Modal>
    </AdminLayout>
  );
}
