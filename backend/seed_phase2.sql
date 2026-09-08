USE TreasuryDB;
GO

DECLARE @QnbId INT = (SELECT BankId FROM ref.Bank WHERE BankCode = 'QNB');
DECLARE @CbqId INT = (SELECT BankId FROM ref.Bank WHERE BankCode = 'CBQ');
DECLARE @CurrId SMALLINT = (SELECT CurrencyId FROM ref.Currency WHERE CurrencyCode = 'QAR');
DECLARE @BuId INT = (SELECT BusinessUnitId FROM org.BusinessUnit WHERE BusinessUnitCode = 'HQ');
DECLARE @PerId INT = (SELECT TOP 1 ReportingPeriodId FROM rpt.ReportingPeriod);
DECLARE @VerId BIGINT = (SELECT TOP 1 ReportVersionId FROM rpt.ReportVersion);

IF NOT EXISTS (SELECT 1 FROM ref.FacilityType WHERE FacilityTypeCode = 'OD')
BEGIN
    INSERT INTO ref.FacilityType (FacilityTypeCode, FacilityTypeName) VALUES ('OD', 'Overdraft');
    INSERT INTO ref.FacilityType (FacilityTypeCode, FacilityTypeName) VALUES ('LC', 'Letter of Credit');
END

-- Seed Working Capital
DELETE FROM treasury.FacilityUtilization;
DELETE FROM treasury.WorkingCapitalFacility;

DECLARE @OdId SMALLINT = (SELECT FacilityTypeId FROM ref.FacilityType WHERE FacilityTypeCode = 'OD');
DECLARE @LcId SMALLINT = (SELECT FacilityTypeId FROM ref.FacilityType WHERE FacilityTypeCode = 'LC');

INSERT INTO treasury.WorkingCapitalFacility (BusinessUnitId, BankId, FacilityTypeId, FacilityReference, CurrencyId, SanctionedLimit)
VALUES (@BuId, @QnbId, @OdId, 'FAC-QNB-OD-01', @CurrId, 50.0);

DECLARE @Fac1 BIGINT = SCOPE_IDENTITY();

INSERT INTO treasury.FacilityUtilization (FacilityId, ReportingPeriodId, ReportVersionId, AsOfDate, UtilizedAmount, AvailableAmount, UtilizationPct, SourceType)
VALUES (@Fac1, @PerId, @VerId, '2026-08-15', 20.0, 30.0, 40.0, 'Manual');

INSERT INTO treasury.WorkingCapitalFacility (BusinessUnitId, BankId, FacilityTypeId, FacilityReference, CurrencyId, SanctionedLimit)
VALUES (@BuId, @CbqId, @LcId, 'FAC-CBQ-LC-01', @CurrId, 100.0);

DECLARE @Fac2 BIGINT = SCOPE_IDENTITY();

INSERT INTO treasury.FacilityUtilization (FacilityId, ReportingPeriodId, ReportVersionId, AsOfDate, UtilizedAmount, AvailableAmount, UtilizationPct, SourceType)
VALUES (@Fac2, @PerId, @VerId, '2026-08-15', 85.0, 15.0, 85.0, 'Manual');


-- Seed Loans
DELETE FROM treasury.Loan;

INSERT INTO treasury.Loan (BusinessUnitId, BankId, LenderName, LoanReference, LoanTypeCode, CurrencyId, OriginalLoanAmount, CurrentOutstanding, MaturityDate)
VALUES (@BuId, @QnbId, 'Qatar National Bank', 'LOAN-QNB-2023', 'TERM', @CurrId, 250.0, 180.0, '2028-12-31');

INSERT INTO treasury.Loan (BusinessUnitId, BankId, LenderName, LoanReference, LoanTypeCode, CurrencyId, OriginalLoanAmount, CurrentOutstanding, MaturityDate)
VALUES (@BuId, @CbqId, 'Commercial Bank', 'LOAN-CBQ-2025', 'PROJECT', @CurrId, 500.0, 480.0, '2035-06-30');
GO
