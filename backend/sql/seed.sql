-- =============================================================================
-- MERIDIAN DIAGNOSTICS LIS/LIMS - SEED DATA FOR SQL*PLUS / ORACLE
-- =============================================================================

SET AUTOCOMMIT OFF;

-- -----------------------------------------------------------------------------
-- 1. REFERRING DOCTORS
-- -----------------------------------------------------------------------------
INSERT INTO Doctor (Doctor_ID, Name, Specialization) VALUES ('D001', 'Dr. Arjun Mehta', 'General Medicine');
INSERT INTO Doctor (Doctor_ID, Name, Specialization) VALUES ('D002', 'Dr. Priya Sharma', 'Endocrinology');
INSERT INTO Doctor (Doctor_ID, Name, Specialization) VALUES ('D003', 'Dr. Karthik Rao', 'Cardiology');
INSERT INTO Doctor (Doctor_ID, Name, Specialization) VALUES ('D004', 'Dr. Sneha Pillai', 'Nephrology');
INSERT INTO Doctor (Doctor_ID, Name, Specialization) VALUES ('D005', 'Dr. Rahul Fernandes', 'Paediatrics');
INSERT INTO Doctor (Doctor_ID, Name, Specialization) VALUES ('D006', 'Dr. Meera Gupta', 'Orthopaedics');
INSERT INTO Doctor (Doctor_ID, Name, Specialization) VALUES ('D007', 'Dr. Sandeep Nair', 'Gastroenterology');

-- -----------------------------------------------------------------------------
-- 2. LABORATORIES
-- -----------------------------------------------------------------------------
INSERT INTO Laboratory (Lab_ID, Lab_Name, Location, Contact_No) VALUES ('L01', 'Central Processing Lab', 'Residency Road, Bengaluru', '9845012345');
INSERT INTO Laboratory (Lab_ID, Lab_Name, Location, Contact_No) VALUES ('L02', 'Northside Collection Centre', 'Hebbal, Bengaluru', '9845023456');
INSERT INTO Laboratory (Lab_ID, Lab_Name, Location, Contact_No) VALUES ('L03', 'Whitefield Diagnostics Unit', 'Whitefield, Bengaluru', '9845034567');
INSERT INTO Laboratory (Lab_ID, Lab_Name, Location, Contact_No) VALUES ('L04', 'Jayanagar Imaging Centre', 'Jayanagar, Bengaluru', '9845045678');

-- -----------------------------------------------------------------------------
-- 3. LAB STAFF (TECHNICIANS & PATHOLOGISTS)
-- -----------------------------------------------------------------------------
-- Technicians (ST001 - ST008)
INSERT INTO LabStaff (Staff_ID, Name, Shift) VALUES ('ST001', 'Rahul Menon', 'Morning');
INSERT INTO LabTechnician (Staff_ID, Certification) VALUES ('ST001', 'BSc MLT');

INSERT INTO LabStaff (Staff_ID, Name, Shift) VALUES ('ST002', 'Ananya Deshmukh', 'Morning');
INSERT INTO LabTechnician (Staff_ID, Certification) VALUES ('ST002', 'DMLT');

INSERT INTO LabStaff (Staff_ID, Name, Shift) VALUES ('ST003', 'Vikram Patel', 'Evening');
INSERT INTO LabTechnician (Staff_ID, Certification) VALUES ('ST003', 'Phlebotomy Level II');

INSERT INTO LabStaff (Staff_ID, Name, Shift) VALUES ('ST004', 'Divya Nair', 'Evening');
INSERT INTO LabTechnician (Staff_ID, Certification) VALUES ('ST004', 'MSc MLT');

INSERT INTO LabStaff (Staff_ID, Name, Shift) VALUES ('ST005', 'Joseph D''Souza', 'Night');
INSERT INTO LabTechnician (Staff_ID, Certification) VALUES ('ST005', 'BSc MLT');

INSERT INTO LabStaff (Staff_ID, Name, Shift) VALUES ('ST006', 'Lakshmi Venkatesh', 'Night');
INSERT INTO LabTechnician (Staff_ID, Certification) VALUES ('ST006', 'DMLT');

INSERT INTO LabStaff (Staff_ID, Name, Shift) VALUES ('ST007', 'Sandeep Kulkarni', 'General');
INSERT INTO LabTechnician (Staff_ID, Certification) VALUES ('ST007', 'BSc MLT');

INSERT INTO LabStaff (Staff_ID, Name, Shift) VALUES ('ST008', 'Fatima Sheikh', 'General');
INSERT INTO LabTechnician (Staff_ID, Certification) VALUES ('ST008', 'DMLT');

-- Pathologists (ST009 - ST012)
INSERT INTO LabStaff (Staff_ID, Name, Shift) VALUES ('ST009', 'Dr. Vikram Iyer', 'Morning');
INSERT INTO Pathologist (Staff_ID, License_No, Qualification) VALUES ('ST009', 'KA/MC/41029', 'MD (Pathology)');

INSERT INTO LabStaff (Staff_ID, Name, Shift) VALUES ('ST010', 'Dr. Anita Banerjee', 'Morning');
INSERT INTO Pathologist (Staff_ID, License_No, Qualification) VALUES ('ST010', 'KA/MC/38910', 'MBBS, MD');

INSERT INTO LabStaff (Staff_ID, Name, Shift) VALUES ('ST011', 'Dr. Rohan Verma', 'Evening');
INSERT INTO Pathologist (Staff_ID, License_No, Qualification) VALUES ('ST011', 'KA/MC/52180', 'DNB (Pathology)');

INSERT INTO LabStaff (Staff_ID, Name, Shift) VALUES ('ST012', 'Dr. Neha Nambiar', 'General');
INSERT INTO Pathologist (Staff_ID, License_No, Qualification) VALUES ('ST012', 'KA/MC/47321', 'MD, DCP');

-- -----------------------------------------------------------------------------
-- 4. DIAGNOSTIC TESTS & SUBTYPES
-- -----------------------------------------------------------------------------
-- Pathology Tests
INSERT INTO Test (Test_ID, Test_Name, Category, Price) VALUES ('T001', 'Haemoglobin', 'Pathology', 180.00);
INSERT INTO PathologyTest (Test_ID, Specimen_Type) VALUES ('T001', 'Blood');

INSERT INTO Test (Test_ID, Test_Name, Category, Price) VALUES ('T002', 'Total Leucocyte Count', 'Pathology', 220.00);
INSERT INTO PathologyTest (Test_ID, Specimen_Type) VALUES ('T002', 'Blood');

INSERT INTO Test (Test_ID, Test_Name, Category, Price) VALUES ('T003', 'Platelet Count', 'Pathology', 240.00);
INSERT INTO PathologyTest (Test_ID, Specimen_Type) VALUES ('T003', 'Blood');

INSERT INTO Test (Test_ID, Test_Name, Category, Price) VALUES ('T004', 'Fasting Blood Glucose', 'Pathology', 150.00);
INSERT INTO PathologyTest (Test_ID, Specimen_Type) VALUES ('T004', 'Serum');

INSERT INTO Test (Test_ID, Test_Name, Category, Price) VALUES ('T005', 'HbA1c', 'Pathology', 520.00);
INSERT INTO PathologyTest (Test_ID, Specimen_Type) VALUES ('T005', 'Blood');

INSERT INTO Test (Test_ID, Test_Name, Category, Price) VALUES ('T006', 'Serum Creatinine', 'Pathology', 260.00);
INSERT INTO PathologyTest (Test_ID, Specimen_Type) VALUES ('T006', 'Serum');

INSERT INTO Test (Test_ID, Test_Name, Category, Price) VALUES ('T007', 'Blood Urea Nitrogen', 'Pathology', 240.00);
INSERT INTO PathologyTest (Test_ID, Specimen_Type) VALUES ('T007', 'Serum');

INSERT INTO Test (Test_ID, Test_Name, Category, Price) VALUES ('T008', 'Total Cholesterol', 'Pathology', 320.00);
INSERT INTO PathologyTest (Test_ID, Specimen_Type) VALUES ('T008', 'Serum');

INSERT INTO Test (Test_ID, Test_Name, Category, Price) VALUES ('T009', 'Triglycerides', 'Pathology', 300.00);
INSERT INTO PathologyTest (Test_ID, Specimen_Type) VALUES ('T009', 'Serum');

INSERT INTO Test (Test_ID, Test_Name, Category, Price) VALUES ('T010', 'TSH', 'Pathology', 450.00);
INSERT INTO PathologyTest (Test_ID, Specimen_Type) VALUES ('T010', 'Serum');

INSERT INTO Test (Test_ID, Test_Name, Category, Price) VALUES ('T011', 'Serum Bilirubin (Total)', 'Pathology', 280.00);
INSERT INTO PathologyTest (Test_ID, Specimen_Type) VALUES ('T011', 'Serum');

INSERT INTO Test (Test_ID, Test_Name, Category, Price) VALUES ('T012', 'SGPT / ALT', 'Pathology', 260.00);
INSERT INTO PathologyTest (Test_ID, Specimen_Type) VALUES ('T012', 'Serum');

INSERT INTO Test (Test_ID, Test_Name, Category, Price) VALUES ('T013', 'Urine Routine Examination', 'Pathology', 200.00);
INSERT INTO PathologyTest (Test_ID, Specimen_Type) VALUES ('T013', 'Urine');

INSERT INTO Test (Test_ID, Test_Name, Category, Price) VALUES ('T014', 'Throat Swab Culture', 'Pathology', 480.00);
INSERT INTO PathologyTest (Test_ID, Specimen_Type) VALUES ('T014', 'Swab');

-- Radiology Tests
INSERT INTO Test (Test_ID, Test_Name, Category, Price) VALUES ('T015', 'Chest X-Ray PA View', 'Radiology', 650.00);
INSERT INTO RadiologyTest (Test_ID, Imaging_Modality) VALUES ('T015', 'X-Ray');

INSERT INTO Test (Test_ID, Test_Name, Category, Price) VALUES ('T016', 'X-Ray Knee AP/Lateral', 'Radiology', 700.00);
INSERT INTO RadiologyTest (Test_ID, Imaging_Modality) VALUES ('T016', 'X-Ray');

INSERT INTO Test (Test_ID, Test_Name, Category, Price) VALUES ('T017', 'MRI Brain Plain', 'Radiology', 6800.00);
INSERT INTO RadiologyTest (Test_ID, Imaging_Modality) VALUES ('T017', 'MRI');

INSERT INTO Test (Test_ID, Test_Name, Category, Price) VALUES ('T018', 'MRI Lumbar Spine', 'Radiology', 7200.00);
INSERT INTO RadiologyTest (Test_ID, Imaging_Modality) VALUES ('T018', 'MRI');

INSERT INTO Test (Test_ID, Test_Name, Category, Price) VALUES ('T019', 'CT Abdomen Contrast', 'Radiology', 5400.00);
INSERT INTO RadiologyTest (Test_ID, Imaging_Modality) VALUES ('T019', 'CT Scan');

INSERT INTO Test (Test_ID, Test_Name, Category, Price) VALUES ('T020', 'Ultrasound Abdomen', 'Radiology', 1200.00);
INSERT INTO RadiologyTest (Test_ID, Imaging_Modality) VALUES ('T020', 'Ultrasound');

-- -----------------------------------------------------------------------------
-- 5. PATIENTS & CONTACTS
-- -----------------------------------------------------------------------------
INSERT INTO Patient (Patient_ID, First_Name, Last_Name, DOB, Gender) VALUES ('P0001', 'Kavya', 'Nair', TO_DATE('1994-06-15', 'YYYY-MM-DD'), 'F');
INSERT INTO Patient_Contact (Patient_ID, Contact_No) VALUES ('P0001', '9845011223');
INSERT INTO Patient_Contact (Patient_ID, Contact_No) VALUES ('P0001', '9845099887');

INSERT INTO Patient (Patient_ID, First_Name, Last_Name, DOB, Gender) VALUES ('P0002', 'Arjun', 'Sharma', TO_DATE('1985-03-22', 'YYYY-MM-DD'), 'M');
INSERT INTO Patient_Contact (Patient_ID, Contact_No) VALUES ('P0002', '9845022334');

INSERT INTO Patient (Patient_ID, First_Name, Last_Name, DOB, Gender) VALUES ('P0003', 'Meera', 'Reddy', TO_DATE('1978-11-09', 'YYYY-MM-DD'), 'F');
INSERT INTO Patient_Contact (Patient_ID, Contact_No) VALUES ('P0003', '9845033445');

INSERT INTO Patient (Patient_ID, First_Name, Last_Name, DOB, Gender) VALUES ('P0004', 'Rohan', 'Iyer', TO_DATE('2001-08-30', 'YYYY-MM-DD'), 'M');
INSERT INTO Patient_Contact (Patient_ID, Contact_No) VALUES ('P0004', '9845044556');

INSERT INTO Patient (Patient_ID, First_Name, Last_Name, DOB, Gender) VALUES ('P0005', 'Ananya', 'Menon', TO_DATE('1965-12-04', 'YYYY-MM-DD'), 'F');
INSERT INTO Patient_Contact (Patient_ID, Contact_No) VALUES ('P0005', '9845055667');

INSERT INTO Patient (Patient_ID, First_Name, Last_Name, DOB, Gender) VALUES ('P0006', 'Vikram', 'Gupta', TO_DATE('1990-01-18', 'YYYY-MM-DD'), 'M');
INSERT INTO Patient_Contact (Patient_ID, Contact_No) VALUES ('P0006', '9845066778');

INSERT INTO Patient (Patient_ID, First_Name, Last_Name, DOB, Gender) VALUES ('P0007', 'Divya', 'Patel', TO_DATE('1982-07-25', 'YYYY-MM-DD'), 'F');
INSERT INTO Patient_Contact (Patient_ID, Contact_No) VALUES ('P0007', '9845077889');

INSERT INTO Patient (Patient_ID, First_Name, Last_Name, DOB, Gender) VALUES ('P0008', 'Sandeep', 'Rao', TO_DATE('1972-05-14', 'YYYY-MM-DD'), 'M');
INSERT INTO Patient_Contact (Patient_ID, Contact_No) VALUES ('P0008', '9845088990');

INSERT INTO Patient (Patient_ID, First_Name, Last_Name, DOB, Gender) VALUES ('P0009', 'Priya', 'Fernandes', TO_DATE('1998-09-03', 'YYYY-MM-DD'), 'F');
INSERT INTO Patient_Contact (Patient_ID, Contact_No) VALUES ('P0009', '9845099001');

INSERT INTO Patient (Patient_ID, First_Name, Last_Name, DOB, Gender) VALUES ('P0010', 'Rahul', 'Krishnan', TO_DATE('1960-10-19', 'YYYY-MM-DD'), 'M');
INSERT INTO Patient_Contact (Patient_ID, Contact_No) VALUES ('P0010', '9845010112');

-- -----------------------------------------------------------------------------
-- 6. ORDERS & ORDER INCLUDES TEST
-- -----------------------------------------------------------------------------
-- Order 1: Completed for Kavya Nair
INSERT INTO TestOrder (Order_ID, Patient_ID, Doctor_ID, Order_Date, Status)
VALUES ('O0001', 'P0001', 'D001', TO_DATE('2026-09-10', 'YYYY-MM-DD'), 'Completed');
INSERT INTO OrderIncludesTest (Order_ID, Test_ID) VALUES ('O0001', 'T001');
INSERT INTO OrderIncludesTest (Order_ID, Test_ID) VALUES ('O0001', 'T004');
INSERT INTO OrderIncludesTest (Order_ID, Test_ID) VALUES ('O0001', 'T005');

-- Order 2: Completed for Arjun Sharma
INSERT INTO TestOrder (Order_ID, Patient_ID, Doctor_ID, Order_Date, Status)
VALUES ('O0002', 'P0002', 'D002', TO_DATE('2026-09-12', 'YYYY-MM-DD'), 'Completed');
INSERT INTO OrderIncludesTest (Order_ID, Test_ID) VALUES ('O0002', 'T006');
INSERT INTO OrderIncludesTest (Order_ID, Test_ID) VALUES ('O0002', 'T007');

-- Order 3: Processing (Sample collected, awaiting results) for Meera Reddy
INSERT INTO TestOrder (Order_ID, Patient_ID, Doctor_ID, Order_Date, Status)
VALUES ('O0003', 'P0003', 'D003', TO_DATE('2026-09-16', 'YYYY-MM-DD'), 'Processing');
INSERT INTO OrderIncludesTest (Order_ID, Test_ID) VALUES ('O0003', 'T008');
INSERT INTO OrderIncludesTest (Order_ID, Test_ID) VALUES ('O0003', 'T009');

-- Order 4: Processing (Sample collected) for Rohan Iyer
INSERT INTO TestOrder (Order_ID, Patient_ID, Doctor_ID, Order_Date, Status)
VALUES ('O0004', 'P0004', 'D004', TO_DATE('2026-09-17', 'YYYY-MM-DD'), 'Processing');
INSERT INTO OrderIncludesTest (Order_ID, Test_ID) VALUES ('O0004', 'T001');
INSERT INTO OrderIncludesTest (Order_ID, Test_ID) VALUES ('O0004', 'T002');

-- Order 5: Pending (Booked, sample not yet collected) for Ananya Menon
INSERT INTO TestOrder (Order_ID, Patient_ID, Doctor_ID, Order_Date, Status)
VALUES ('O0005', 'P0005', 'D005', TO_DATE('2026-09-18', 'YYYY-MM-DD'), 'Pending');
INSERT INTO OrderIncludesTest (Order_ID, Test_ID) VALUES ('O0005', 'T015');

-- Order 6: Pending for Vikram Gupta
INSERT INTO TestOrder (Order_ID, Patient_ID, Doctor_ID, Order_Date, Status)
VALUES ('O0006', 'P0006', 'D006', TO_DATE('2026-09-18', 'YYYY-MM-DD'), 'Pending');
INSERT INTO OrderIncludesTest (Order_ID, Test_ID) VALUES ('O0006', 'T010');

-- Order 7: Cancelled for Divya Patel
INSERT INTO TestOrder (Order_ID, Patient_ID, Doctor_ID, Order_Date, Status)
VALUES ('O0007', 'P0007', 'D007', TO_DATE('2026-09-14', 'YYYY-MM-DD'), 'Cancelled');
INSERT INTO OrderIncludesTest (Order_ID, Test_ID) VALUES ('O0007', 'T011');

-- -----------------------------------------------------------------------------
-- 7. SAMPLES
-- -----------------------------------------------------------------------------
-- Sample for Order 1
INSERT INTO Sample (Order_ID, Sample_No, Collection_Date, Sample_Type, Lab_ID, Tech_ID)
VALUES ('O0001', 'S1', TO_DATE('2026-09-10', 'YYYY-MM-DD'), 'Blood', 'L01', 'ST001');

-- Sample for Order 2
INSERT INTO Sample (Order_ID, Sample_No, Collection_Date, Sample_Type, Lab_ID, Tech_ID)
VALUES ('O0002', 'S1', TO_DATE('2026-09-12', 'YYYY-MM-DD'), 'Serum', 'L01', 'ST001');

-- Sample for Order 3
INSERT INTO Sample (Order_ID, Sample_No, Collection_Date, Sample_Type, Lab_ID, Tech_ID)
VALUES ('O0003', 'S1', TO_DATE('2026-09-16', 'YYYY-MM-DD'), 'Serum', 'L02', 'ST002');

-- Sample for Order 4
INSERT INTO Sample (Order_ID, Sample_No, Collection_Date, Sample_Type, Lab_ID, Tech_ID)
VALUES ('O0004', 'S1', TO_DATE('2026-09-17', 'YYYY-MM-DD'), 'Blood', 'L01', 'ST001');

-- -----------------------------------------------------------------------------
-- 8. REPORTS
-- -----------------------------------------------------------------------------
-- Report 1: Authorized by Dr. Vikram Iyer for Order 1
INSERT INTO Report (Report_ID, Order_ID, Report_Date, Pathologist_ID)
VALUES ('R0001', 'O0001', TO_DATE('2026-09-11', 'YYYY-MM-DD'), 'ST009');

-- Report 2: Authorized by Dr. Anita Banerjee for Order 2
INSERT INTO Report (Report_ID, Order_ID, Report_Date, Pathologist_ID)
VALUES ('R0002', 'O0002', TO_DATE('2026-09-13', 'YYYY-MM-DD'), 'ST010');

-- -----------------------------------------------------------------------------
-- 9. CLINICAL FINDINGS (HASRESULT)
-- -----------------------------------------------------------------------------
-- Findings for Report 1 (O0001: T001, T004, T005)
INSERT INTO HasResult (Report_ID, Test_ID, Observed_Value, Unit, Remark)
VALUES ('R0001', 'T001', '13.4', 'g/dL', 'Normal');

INSERT INTO HasResult (Report_ID, Test_ID, Observed_Value, Unit, Remark)
VALUES ('R0001', 'T004', '92', 'mg/dL', 'Normal');

INSERT INTO HasResult (Report_ID, Test_ID, Observed_Value, Unit, Remark)
VALUES ('R0001', 'T005', '5.4', '%', 'Normal');

-- Findings for Report 2 (O0002: T006, T007)
INSERT INTO HasResult (Report_ID, Test_ID, Observed_Value, Unit, Remark)
VALUES ('R0002', 'T006', '1.6', 'mg/dL', 'Elevated');

INSERT INTO HasResult (Report_ID, Test_ID, Observed_Value, Unit, Remark)
VALUES ('R0002', 'T007', '26', 'mg/dL', 'Elevated');

COMMIT;
