import { useState } from 'react';

function LectureSchedule() {
  const [showIndustryForm, setShowIndustryForm] = useState(false);
  const [industryMentor, setIndustryMentor] = useState({
    name: '', designation: '', company: '', contact: '', email: ''
  });
  const [submittedIndustryMentor, setSubmittedIndustryMentor] = useState(null);

  const [showClusterForm, setShowClusterForm] = useState(false);
  const [clusterMentor, setClusterMentor] = useState({
    name: '', designation: '', department: '', contact: '', email: ''
  });
  const [submittedClusterMentor, setSubmittedClusterMentor] = useState(null);

  const handleChange = (e, setter) => {
    const { name, value } = e.target;
    setter(prev => ({ ...prev, [name]: value }));
  };

  const handleIndustrySubmit = (e) => {
    e.preventDefault();
    setSubmittedIndustryMentor(industryMentor);
    setIndustryMentor({ name: '', designation: '', company: '', contact: '', email: '' });
    setShowIndustryForm(false);
  };

  const handleClusterSubmit = (e) => {
    e.preventDefault();
    setSubmittedClusterMentor(clusterMentor);
    setClusterMentor({ name: '', designation: '', department: '', contact: '', email: '' });
    setShowClusterForm(false);
  };

  return (
    <>
      <style>{`
        .lecture-page-container {
          width: 100%;
          padding: 20px;
          background-color: #fff;
          border-radius: 8px;
          font-family: 'Poppins', sans-serif;
          box-sizing: border-box;
        }

        .lecture-header-buttons {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-bottom: 20px;
        }

        .button1 {
          padding: 8px 16px;
          font-size: 14px;
          background-color: #4caf50;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          color: white;
          transition: background-color 0.3s;
        }
        .button2{
          padding: 8px 16px;
          font-size: 14px;
          background-color: #4caf50;
          border: none;
          float: right;
          font-weight: bold;
          margin-left: 400px;
          border-radius: 5px;
          cursor: pointer;
          color: white;
          transition: background-color 0.3s;
        }

        .button1:hover {
          background-color: #45a049;
        }

        .popup-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.4);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 9998;
        }
        .header-row{
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px; /* More space below header */
          padding: 20px 25px; /* Increased padding */
          background-color: #fff;
          border-radius: 12px; /* Rounded corners */
          box-shadow: 0 4px 15px rgba(0,0,0,0.08); /* Subtle shadow */
        }
        .popup {
          background: white;
          padding: 25px;
          width: 90%;
          max-width: 400px;
          border-radius: 8px;
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
          z-index: 9999;
          animation: fadeInScale 0.3s ease-out;
        }

        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }

        .popup-header {
          font-size: 20px;
          font-weight: bold;
          margin-bottom: 20px;
          text-align: center;
          color: #333;
        }

        .popup-form input {
          display: block;
          width: 100%;
          padding: 10px;
          margin-bottom: 12px;
          border: 1px solid #ccc;
          border-radius: 4px;
          font-size: 14px;
          box-sizing: border-box;
        }

        
        .popup-submit {
          padding: 10px;
          font-size: 14px;
          border: none;
          border-radius: 4px;
          color: white;
          cursor: pointer;
          width: 48%;
        }
        .popup-cancel{
          padding: 10px;
          font-size: 14px;
          border: none;
          border-radius: 4px;
          color: white;
          margin-left: 13px;
          cursor: pointer;
          width: 48%;
        }
        .popup-submit { background-color: #4caf50; }
        .popup-cancel { background-color: #f44336; }

        .title {
          margin: 0;
          font-weight: 700; /* Bolder title */
          font-size: 1.2rem; /* Larger title */
          color: #28a745;
        }

        .table-wrapper {
          overflow-x: auto;
          margin-bottom: 30px;
        }

        .table10 {
  table-layout: fixed;
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  text-align: center;
}

.table10 th,
.table10 td {
  border: 1px solid #000;
  padding: 5px;
  white-space: nowrap;
  vertical-align: middle;
  writing-mode: horizontal-tb !important;
  transform: rotate(0deg);
}
        th.narrow,
        td.narrow {
          width: 15% !important;
          width: 100px;
          max-width: 10px;
          white-space: nowrap;
        }

        .table10 thead th {
          background-color: #f0f2f5;
          font-weight: 600;
        }

        .mentor-container {
          margin-top: 20px;
          display: flex;
          justify-content: center;
        }

        .mentor-table {
          width: 100%;
          max-width: 800px;
          border-collapse: collapse;
          border: 1px solid #ccc;
          font-size: 14px;
        }

        .mentor-table th, .mentor-table td {
          border: 1px solid #ccc;
          padding: 10px;
          text-align: left;
        }

        .mentor-table th {
          background-color: #f0f2f5;
          font-weight: 600;
        }

        .mentor-table .section-title {
          font-weight: bold;
          font-size: 16px;
          width: 150px;
        }
      `}</style>

      <div className="lecture-page-container">
        <div className="header-row">
          <p className="title">3.12 Lecture Schedule</p>
          <button className="button2" onClick={() => setShowClusterForm(true)}>Add Cluster Mentor</button>
          <button className="button1" onClick={() => setShowIndustryForm(true)}>Add Industry Mentor</button>
          
        </div>
        

        {showClusterForm && (
          <div className="popup-overlay">
            <div className="popup">
              <div className="popup-header">Cluster Mentor</div>
              <form className="popup-form" onSubmit={handleClusterSubmit}>
                <input name="name" value={clusterMentor.name} onChange={(e) => handleChange(e, setClusterMentor)} placeholder="Name" required />
                <input name="designation" value={clusterMentor.designation} onChange={(e) => handleChange(e, setClusterMentor)} placeholder="Designation" required />
                <input name="department" value={clusterMentor.department} onChange={(e) => handleChange(e, setClusterMentor)} placeholder="Department" required />
                <input name="contact" value={clusterMentor.contact} onChange={(e) => handleChange(e, setClusterMentor)} placeholder="Contact No" required />
                <input name="email" type="email" value={clusterMentor.email} onChange={(e) => handleChange(e, setClusterMentor)} placeholder="Email" required />
                <div className='popup-button'>
                  <button className='popup-submit'>Submit</button>
                  <button className='popup-cancel' onClick={() => setShowClusterForm(false)}>Cancel</button>
                </div>  
              </form>
            </div>
          </div>
        )}

        {showIndustryForm && (
          <div className="popup-overlay">
            <div className="popup">
              <div className="popup-header">Industry Mentor</div>
              <form className="popup-form" onSubmit={handleIndustrySubmit}>
                <input name="name" value={industryMentor.name} onChange={(e) => handleChange(e, setIndustryMentor)} placeholder="Name" required />
                <input name="designation" value={industryMentor.designation} onChange={(e) => handleChange(e, setIndustryMentor)} placeholder="Designation" required />
                <input name="company" value={industryMentor.company} onChange={(e) => handleChange(e, setIndustryMentor)} placeholder="Company" required />
                <input name="contact" value={industryMentor.contact} onChange={(e) => handleChange(e, setIndustryMentor)} placeholder="Contact No" required />
                <input name="email" type="email" value={industryMentor.email} onChange={(e) => handleChange(e, setIndustryMentor)} placeholder="Email" required />
                <div className='popup-button'>
                  <button className='popup-submit'>Submit</button>
                  <button className='popup-cancel' onClick={() => setShowIndustryForm(false)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="table-wrapper">
          <table className="table10">
            <thead>
              <tr>
                <th className="narrow" colSpan={3}>Teaching Scheme</th>
                <th className="narrow" rowSpan={4}>Credit<br />(L+T+P)</th>
                <th className="narrow" rowSpan={4}>Paper<br />Hr</th>
                <th colSpan={6}>Theory</th>
                <th colSpan={6}>Practical</th>
              </tr>
              <tr>
                <th rowSpan={3}>L</th>
                <th rowSpan={3}>T</th>
                <th rowSpan={3}>P</th>
                <th colSpan={2}>ESE</th>
                <th colSpan={2}>PA</th>
                <th colSpan={2}>Total</th>
                <th colSpan={2}>ESE</th>
                <th colSpan={2}>PA</th>
                <th colSpan={2}>Total</th>
              </tr>
              <tr>
                <th>Max</th><th>Min</th>
                <th>Max</th><th>Min</th>
                <th>Max</th><th>Min</th>
                <th>Max</th><th>Min</th>
                <th>Max</th><th>Min</th>
                <th>Max</th><th>Min</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1</td>
                <td>0</td>
                <td>2</td>
                <td></td>
                <td></td>
                <td></td><td></td>
                <td></td><td></td>
                <td></td><td></td>
                <td>25</td><td>10</td>
                <td>25</td><td>10</td>
                <td></td><td></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mentor-container">
          <table className="mentor-table">
            <tbody>
              <tr><th colSpan={2}>Cluster Mentor</th></tr>
              <tr>
                <td className="section-title">Details</td>
                <td>
                  {submittedClusterMentor ? (
                    <>
                      <p><strong>Name:</strong> {submittedClusterMentor.name}</p>
                      <p><strong>Designation:</strong> {submittedClusterMentor.designation}</p>
                      <p><strong>Department:</strong> {submittedClusterMentor.department}</p>
                      <p><strong>Contact:</strong> {submittedClusterMentor.contact}</p>
                      <p><strong>Email:</strong> {submittedClusterMentor.email}</p>
                    </>
                  ) : <p>No details submitted.</p>}
                </td>
              </tr>
              <tr><th colSpan={2}>Industry Mentor</th></tr>
              <tr>
                <td className="section-title">Details</td>
                <td>
                  {submittedIndustryMentor ? (
                    <>
                      <p><strong>Name:</strong> {submittedIndustryMentor.name}</p>
                      <p><strong>Designation:</strong> {submittedIndustryMentor.designation}</p>
                      <p><strong>Company:</strong> {submittedIndustryMentor.company}</p>
                      <p><strong>Contact:</strong> {submittedIndustryMentor.contact}</p>
                      <p><strong>Email:</strong> {submittedIndustryMentor.email}</p>
                    </>
                  ) : <p>No details submitted.</p>}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export default LectureSchedule;
