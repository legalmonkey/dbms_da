/**
 * Centralized Database Table and Column Mappings.
 *
 * NOTE FOR DATABASE TEAMMATE:
 * If your final SQL schema uses different table or column names (e.g., lower_snake_case
 * or plural names like 'patients' instead of 'Patient'), update this mapping file.
 * The services use these mappings throughout the codebase to build queries cleanly.
 */

module.exports = {
  tables: {
    patient: 'Patient',
    patientContact: 'Patient_Contact',
    doctor: 'Doctor',
    test: 'Test',
    pathologyTest: 'PathologyTest',
    radiologyTest: 'RadiologyTest',
    testOrder: 'TestOrder',
    orderIncludesTest: 'OrderIncludesTest',
    laboratory: 'Laboratory',
    labStaff: 'LabStaff',
    labTechnician: 'LabTechnician',
    pathologist: 'Pathologist',
    sample: 'Sample',
    report: 'Report',
    hasResult: 'HasResult',
  },

  columns: {
    patient: {
      id: 'Patient_ID',
      firstName: 'First_Name',
      lastName: 'Last_Name',
      dob: 'DOB',
      gender: 'Gender',
    },
    patientContact: {
      patientId: 'Patient_ID',
      contactNo: 'Contact_No',
    },
    doctor: {
      id: 'Doctor_ID',
      name: 'Doctor_Name',
      specialization: 'Specialization',
    },
    test: {
      id: 'Test_ID',
      name: 'Test_Name',
      category: 'Test_Category',
      price: 'Price',
      unit: 'Unit',
    },
    pathologyTest: {
      testId: 'Test_ID',
      specimenType: 'Specimen_Type',
    },
    radiologyTest: {
      testId: 'Test_ID',
      imagingModality: 'Imaging_Modality',
    },
    testOrder: {
      id: 'Order_ID',
      orderDate: 'Order_Date',
      patientId: 'Patient_ID',
      doctorId: 'Doctor_ID',
      status: 'Status',
      totalPrice: 'Total_Price',
    },
    orderIncludesTest: {
      orderId: 'Order_ID',
      testId: 'Test_ID',
    },
    laboratory: {
      id: 'Lab_ID',
      name: 'Lab_Name',
      location: 'Location',
      contactNo: 'Contact_No',
    },
    labStaff: {
      id: 'Staff_ID',
      name: 'Staff_Name',
      shift: 'Shift',
      role: 'Staff_Role',
    },
    labTechnician: {
      techId: 'Tech_ID',
      certification: 'Certification',
    },
    pathologist: {
      pathologistId: 'Pathologist_ID',
      licenseNo: 'License_No',
      qualification: 'Qualification',
    },
    sample: {
      orderId: 'Order_ID',
      sampleNo: 'Sample_No',
      patientId: 'Patient_ID',
      sampleType: 'Sample_Type',
      collectionDateTime: 'Collection_DateTime',
      labId: 'Lab_ID',
      techId: 'Tech_ID',
      status: 'Status',
    },
    report: {
      id: 'Report_ID',
      orderId: 'Order_ID',
      reportDate: 'Report_Date',
      patientId: 'Patient_ID',
      doctorId: 'Doctor_ID',
      pathologistId: 'Pathologist_ID',
    },
    hasResult: {
      reportId: 'Report_ID',
      testId: 'Test_ID',
      observedValue: 'Observed_Value',
      unit: 'Unit',
      remark: 'Remark',
    },
  },
};

