import { useState } from 'react';
import { message } from 'antd';
import { FiX, FiSave } from 'react-icons/fi';

import api from '../../../api/api';
import styles from './AddLeadModal.module.css';

type AddLeadModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

const educationLevels = ['10th', '12th', 'Bachelors', 'Masters', 'PHD'];

const bachelorCourses = [
  'B.Sc',
  'B.Com',
  'B.A',
  'LLB',
  'MBBS',
  'BDA',
  'B.Sc Nursing',
  'B.Pharm',
  'B.E',
  'B.Tech',
  'BArch',
  'BBA',
  'BCA',
  'BHMS / BAMS',
  'B.Ed',
  'BJMC',
];

const masterCourses = [
  'MSc',
  'MA',
  'MCom',
  'MBA',
  'MCA',
  'M.Tech',
  'M.E',
  'March',
  'LLM',
];

const countries = [
  'CANADA',
  'U.S.A',
  'U.K',
  'SCHENGEN',
  'NON SCHENGEN',
  'IRELAND',
  'AUSTRALIA',
  'NEWZEALAND',
  'THAILAND',
  'CAMBODIA',
  'MALAYSIA',
  'JAPAN',
  'SOUTH KOREA',
  'SOUTH AFRICA',
  'SERBIA',
  'AZERBAIJAN',
  'CYPRUS',
  'BANGLADESH',
  'RUSSIA',
  'EGYPT',
  'CHINA',
  'LEBANON',
  'MOROCCO',
  'KSA',
  'UAE',
  'SURINAME',
  'TURKIYE',
  'OTHERS',
];

const schengenCountries = [
  'GERMANY',
  'DENMARK',
  'POLAND',
  'LATVIA',
  'FINLAND',
  'ICELAND',
  'SWITZERLAND',
  'AUSTRIA',
  'BELGIUM',
  'CZECH REPUBLIC',
  'SLOVENIA',
  'SLOVAKIA',
  'SWEDEN',
  'SPAIN',
  'THE NETHERLANDS',
  'ITALY',
  'FRANCE',
  'LUXEMBURG',
  'MALTA',
  'HUNGARY',
  'GREECE',
  'GREENLAND',
  'NORWAY',
  'ESTONIA',
  'OTHERS',
];

const nonSchengenCountries = [
  'BULGERIA',
  'CYPRUS',
  'CROATIA',
  'GEORGIA',
  'OTHERS',
];

const visaTypes = [
  'Visitor Visa',
  'Tourist Visa',
  'PR Visa',
  'PR Dependent Visa',
  'Student Visa',
  'Student Dependent Visa',
  'Job Seeker Visa',
  'Crew Visa',
  'Transit Visa',
  'Medical Visa',
  'Super Visa',
  'B1/B2 Visa',
  'Others',
];

export default function AddLeadModal({
  open,
  onClose,
  onSuccess,
}: AddLeadModalProps) {
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    fullName: '',
    contactNo: '',
    email: '',
    alternateEmail: '',
    dob: '',
    maritalStatus: '',
    marriageDate: '',
    educationLevel: '',
    educationCourse: '',
    job: '',
    yearsOfExperience: '',
    business: '',
    city: '',
    countryApplying: '',
    schengenCountry: '',
    nonSchengenCountry: '',
    visaType: '',
    applyingWithSpouse: '',
    spouseDob: '',
    spouseEducationStatus: '',
    spouseWorkExperience: '',
    processingFees: '',
    amountPaid: '',
    amountPending: '',
    visaCopy: '',
    visaStatus: '',
    adminComment: '',
  });

  if (!open) {
    return null;
  }

  const updateField = (name: string, value: string) => {
    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setForm({
      fullName: '',
      contactNo: '',
      email: '',
      alternateEmail: '',
      dob: '',
      maritalStatus: '',
      marriageDate: '',
      educationLevel: '',
      educationCourse: '',
      job: '',
      yearsOfExperience: '',
      business: '',
      city: '',
      countryApplying: '',
      schengenCountry: '',
      nonSchengenCountry: '',
      visaType: '',
      applyingWithSpouse: '',
      spouseDob: '',
      spouseEducationStatus: '',
      spouseWorkExperience: '',
      processingFees: '',
      amountPaid: '',
      amountPending: '',
      visaCopy: '',
      visaStatus: '',
      adminComment: '',
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.fullName || !form.contactNo) {
      message.error('Name and Contact No. are required');
      return;
    }

    try {
      setLoading(true);

      await api.post('/leads', form);

      message.success('Lead submitted successfully');
      resetForm();
      onSuccess();
      onClose();
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Failed to submit lead');
    } finally {
      setLoading(false);
    }
  };

  const courseOptions =
    form.educationLevel === 'Bachelors'
      ? bachelorCourses
      : form.educationLevel === 'Masters'
        ? masterCourses
        : [];

  return (
    <div className={styles.backdrop}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <div>
            <span>New Visa Enquiry</span>
            <h2>Add Lead Details</h2>
            <p>Submit complete customer details to admin CRM.</p>
          </div>

          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
          >
            <FiX />
          </button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.section}>
            <h3>Personal Details</h3>

            <div className={styles.grid}>
              <label>
                Name *
                <input
                  value={form.fullName}
                  onChange={(e) => updateField('fullName', e.target.value)}
                  placeholder="Enter applicant name"
                />
              </label>

              <label>
                Contact No. *
                <input
                  value={form.contactNo}
                  onChange={(e) => updateField('contactNo', e.target.value)}
                  placeholder="Enter contact number"
                />
              </label>

              <label>
                Email ID
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="Enter email"
                />
              </label>

              <label>
                Alternate Email ID
                <input
                  type="email"
                  value={form.alternateEmail}
                  onChange={(e) =>
                    updateField('alternateEmail', e.target.value)
                  }
                  placeholder="Enter alternate email"
                />
              </label>

              <label>
                D.O.B
                <input
                  type="date"
                  value={form.dob}
                  onChange={(e) => updateField('dob', e.target.value)}
                />
              </label>

              <label>
                Marital Status
                <select
                  value={form.maritalStatus}
                  onChange={(e) => updateField('maritalStatus', e.target.value)}
                >
                  <option value="">Select</option>
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Divorced">Divorced</option>
                  <option value="Widowed">Widowed</option>
                </select>
              </label>

              <label>
                Marriage Date
                <input
                  type="date"
                  value={form.marriageDate}
                  onChange={(e) => updateField('marriageDate', e.target.value)}
                />
              </label>

              <label>
                City
                <input
                  value={form.city}
                  onChange={(e) => updateField('city', e.target.value)}
                  placeholder="Enter city"
                />
              </label>
            </div>
          </div>

          <div className={styles.section}>
            <h3>Education / Work Details</h3>

            <div className={styles.grid}>
              <label>
                Education
                <select
                  value={form.educationLevel}
                  onChange={(e) => {
                    updateField('educationLevel', e.target.value);
                    updateField('educationCourse', '');
                  }}
                >
                  <option value="">Select education</option>
                  {educationLevels.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Education Course
                {courseOptions.length > 0 ? (
                  <select
                    value={form.educationCourse}
                    onChange={(e) =>
                      updateField('educationCourse', e.target.value)
                    }
                  >
                    <option value="">Select course</option>
                    {courseOptions.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    value={form.educationCourse}
                    onChange={(e) =>
                      updateField('educationCourse', e.target.value)
                    }
                    placeholder="Enter course"
                  />
                )}
              </label>

              <label>
                Job
                <input
                  value={form.job}
                  onChange={(e) => updateField('job', e.target.value)}
                  placeholder="Enter job"
                />
              </label>

              <label>
                Years of Experience
                <input
                  value={form.yearsOfExperience}
                  onChange={(e) =>
                    updateField('yearsOfExperience', e.target.value)
                  }
                  placeholder="Enter experience"
                />
              </label>

              <label>
                Business
                <input
                  value={form.business}
                  onChange={(e) => updateField('business', e.target.value)}
                  placeholder="Enter business"
                />
              </label>
            </div>
          </div>

          <div className={styles.section}>
            <h3>Visa Details</h3>

            <div className={styles.grid}>
              <label>
                Country Applying
                <select
                  value={form.countryApplying}
                  onChange={(e) =>
                    updateField('countryApplying', e.target.value)
                  }
                >
                  <option value="">Select country</option>
                  {countries.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              {form.countryApplying === 'SCHENGEN' && (
                <label>
                  Schengen Country
                  <select
                    value={form.schengenCountry}
                    onChange={(e) =>
                      updateField('schengenCountry', e.target.value)
                    }
                  >
                    <option value="">Select Schengen country</option>
                    {schengenCountries.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {form.countryApplying === 'NON SCHENGEN' && (
                <label>
                  Non Schengen Country
                  <select
                    value={form.nonSchengenCountry}
                    onChange={(e) =>
                      updateField('nonSchengenCountry', e.target.value)
                    }
                  >
                    <option value="">Select Non Schengen country</option>
                    {nonSchengenCountries.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <label>
                Visa Type
                <select
                  value={form.visaType}
                  onChange={(e) => updateField('visaType', e.target.value)}
                >
                  <option value="">Select visa type</option>
                  {visaTypes.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Visa Copy
                <select
                  value={form.visaCopy}
                  onChange={(e) => updateField('visaCopy', e.target.value)}
                >
                  <option value="">Select</option>
                  <option value="Upload Required">Upload Required</option>
                  <option value="Downloaded">Downloaded</option>
                  <option value="Not Available">Not Available</option>
                </select>
              </label>

              <label>
                Visa Status
                <select
                  value={form.visaStatus}
                  onChange={(e) => updateField('visaStatus', e.target.value)}
                >
                  <option value="">Select status</option>
                  <option value="Approved">Approved</option>
                  <option value="Refused">Refused</option>
                  <option value="Pending">Pending</option>
                </select>
              </label>
            </div>
          </div>

          <div className={styles.section}>
            <h3>Spouse Details</h3>

            <div className={styles.grid}>
              <label>
                Applying with Spouse
                <select
                  value={form.applyingWithSpouse}
                  onChange={(e) =>
                    updateField('applyingWithSpouse', e.target.value)
                  }
                >
                  <option value="">Blank</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </label>

              <label>
                Spouse D.O.B
                <input
                  type="date"
                  value={form.spouseDob}
                  onChange={(e) => updateField('spouseDob', e.target.value)}
                />
              </label>

              <label>
                Spouse Education Status
                <select
                  value={form.spouseEducationStatus}
                  onChange={(e) =>
                    updateField('spouseEducationStatus', e.target.value)
                  }
                >
                  <option value="">Select</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                  <option value="House Wife">House Wife</option>
                  <option value="Other">Other</option>
                </select>
              </label>

              <label>
                Spouse Work Experience
                <select
                  value={form.spouseWorkExperience}
                  onChange={(e) =>
                    updateField('spouseWorkExperience', e.target.value)
                  }
                >
                  <option value="">Select</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </label>
            </div>
          </div>

          <div className={styles.section}>
            <h3>Payment Details</h3>

            <div className={styles.grid}>
              <label>
                Processing Fees
                <input
                  type="number"
                  value={form.processingFees}
                  onChange={(e) =>
                    updateField('processingFees', e.target.value)
                  }
                  placeholder="Enter processing fees"
                />
              </label>

              <label>
                Amount Paid
                <input
                  type="number"
                  value={form.amountPaid}
                  onChange={(e) => updateField('amountPaid', e.target.value)}
                  placeholder="Enter paid amount"
                />
              </label>

              <label>
                Amount Pending
                <input
                  type="number"
                  value={form.amountPending}
                  onChange={(e) => updateField('amountPending', e.target.value)}
                  placeholder="Enter pending amount"
                />
              </label>
            </div>
          </div>

          <div className={styles.section}>
            <h3>Admin Comment</h3>

            <textarea
              value={form.adminComment}
              onChange={(e) => updateField('adminComment', e.target.value)}
              placeholder="Enter admin comment"
              rows={4}
            />
          </div>

          <div className={styles.footer}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              type="submit"
              className={styles.saveButton}
              disabled={loading}
            >
              <FiSave />
              {loading ? 'Saving...' : 'Submit Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
