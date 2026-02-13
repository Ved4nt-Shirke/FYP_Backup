import React, { useState, useEffect } from 'react';

const EditAttendanceModal = ({ record, onClose, onSave }) => {
  // Initialize formData with only the necessary fields for update and the students array
  const [formData, setFormData] = useState({
    _id: '',
    topic: '', // Keep topic for the backend payload, even if not displayed
    date: '', // Keep original date for the backend payload, even if not displayed
    remark: '', // Keep original remark for the backend payload, even if not displayed
    students: [], // This is the only part that will be displayed and directly editable
  });

  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    // Populate form data when the modal opens or record prop changes
    if (record) {
      setFormData({
        _id: record._id || '',
        topic: record.topic || '', // Get topic from record for backend payload
        date: record.date || '', // Get original date from record for backend payload
        remark: record.remark || '', // Get original remark from record for backend payload
        students: record.students || [], // Pass students for editing
      });
      setMessage(''); // Clear messages on new record load
      setIsSuccess(false);
    }
  }, [record]);

  // Only need handleChange for students if their properties were individual inputs.
  // Since we're using a select, handleStudentStatusChange is sufficient.
  // Removed general handleChange as it's not needed for hidden fields.

  const handleStudentStatusChange = (rollNo, newStatus) => {
    setFormData(prev => ({
      ...prev,
      students: prev.students.map(student =>
        student.rollNo === rollNo ? { ...student, status: newStatus } : student
      )
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      // Prepare the data to be sent for update
      // Only send fields relevant to TheoryAttendance model for update
      const updatedData = {
        _id: formData._id,
        topic: formData.topic, // Send original topic back
        date: formData.date, // Send original date back
        remark: formData.remark, // Send original remark back
        students: formData.students, // Send updated students array
      };

      // Call the onSave prop, which will handle the API call in the parent (EditAttendance2)
      await onSave(updatedData);
      setMessage('Record updated successfully!');
      setIsSuccess(true);
      // The modal will be closed by the parent's onSave handler
    } catch (error) {
      setMessage(`Error saving changes: ${error.message}`);
      setIsSuccess(false);
      console.error('Error saving changes in modal:', error);
    }
  };

  return (
    // Modal Overlay
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
      {/* Modal Content */}
      <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 max-w-lg w-full relative transform transition-all scale-100 opacity-100">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 text-center">Edit Student Attendance</h2>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl font-bold"
          aria-label="Close"
        >
          &times;
        </button>

        {/* Message display */}
        {message && (
          <div className={`p-3 rounded-lg mb-4 text-center ${isSuccess ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-y-4">
          {/* Display relevant context for the attendance being edited (optional) */}
          <div className="text-center text-gray-600 mb-4">
            <p className="font-semibold">Topic: {record.topic || 'N/A'}</p>
            <p>Date of Completion: {record.date || 'N/A'}</p>
            <p>Remarks: {record.remark || 'N/A'}</p>
          </div>

          {/* Students section (only this will be displayed and editable) */}
          {formData.students && formData.students.length > 0 ? (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Student Attendance:</h3>
              {formData.students.map(student => (
                <div key={student.rollNo} className="flex items-center justify-between mb-2 p-2 border border-gray-200 rounded-md">
                  <span className="text-gray-700">{student.studentName} ({student.rollNo}):</span>
                  <select
                    value={student.status}
                    onChange={(e) => handleStudentStatusChange(student.rollNo, e.target.value)}
                    className="ml-4 px-3 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="Present">Present</option>
                    <option value="Absent">Absent</option>
                  </select>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-600 py-4">No students found for this record.</div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditAttendanceModal;
