USE TreasuryDB;
GO

-- Insert sample Reference data
IF NOT EXISTS (SELECT 1 FROM ref.Currency WHERE CurrencyCode = 'QAR')
BEGIN
    INSERT INTO ref.Currency (CurrencyCode, CurrencyName, DecimalPlaces, IsBaseCurrency) VALUES ('QAR', 'Qatari Riyal', 2, 1);
END

IF NOT EXISTS (SELECT 1 FROM ref.Bank WHERE BankCode = 'QNB')
BEGIN
    INSERT INTO ref.Bank (BankCode, BankName) VALUES ('QNB', 'Qatar National Bank');
    INSERT INTO ref.Bank (BankCode, BankName) VALUES ('CBQ', 'Commercial Bank of Qatar');
END

IF NOT EXISTS (SELECT 1 FROM org.BusinessUnit WHERE BusinessUnitCode = 'HQ')
BEGIN
    INSERT INTO org.BusinessUnit (BusinessUnitCode, BusinessUnitName) VALUES ('HQ', 'Headquarters');
END

IF NOT EXISTS (SELECT 1 FROM rpt.ReportingPeriod WHERE PeriodCode = '2026-08')
BEGIN
    INSERT INTO rpt.ReportingPeriod (PeriodCode, PeriodName, ReportingDate, SubmissionStartAt, BUSubmissionDeadlineAt, PeriodStatus) 
    VALUES ('2026-08', 'August 2026', '2026-08-15', SYSUTCDATETIME(), SYSUTCDATETIME(), 'Open');
END

IF NOT EXISTS (SELECT 1 FROM rpt.ReportVersion WHERE VersionNo = 1)
BEGIN
    DECLARE @PeriodId INT = (SELECT TOP 1 ReportingPeriodId FROM rpt.ReportingPeriod);
    INSERT INTO rpt.ReportVersion (ReportingPeriodId, VersionNo, VersionStatus) VALUES (@PeriodId, 1, 'Draft');
END

-- Seed Bank Accounts and Balances for Funds Position
IF NOT EXISTS (SELECT 1 FROM banking.BankAccount WHERE AccountNumber = '1000-QNB-01')
BEGIN
    DECLARE @QnbId INT = (SELECT BankId FROM ref.Bank WHERE BankCode = 'QNB');
    DECLARE @CbqId INT = (SELECT BankId FROM ref.Bank WHERE BankCode = 'CBQ');
    DECLARE @CurrId SMALLINT = (SELECT CurrencyId FROM ref.Currency WHERE CurrencyCode = 'QAR');
    DECLARE @BuId INT = (SELECT BusinessUnitId FROM org.BusinessUnit WHERE BusinessUnitCode = 'HQ');

    INSERT INTO banking.BankAccount (BusinessUnitId, BankId, AccountName, AccountNumber, CurrencyId) 
    VALUES (@BuId, @QnbId, 'QNB Main Operating', '1000-QNB-01', @CurrId);
    
    INSERT INTO banking.BankAccount (BusinessUnitId, BankId, AccountName, AccountNumber, CurrencyId) 
    VALUES (@BuId, @CbqId, 'CBQ Reserve', '2000-CBQ-02', @CurrId);
END

-- Delete old balances and insert
DELETE FROM banking.BankBalance;
DECLARE @Acc1 BIGINT = (SELECT BankAccountId FROM banking.BankAccount WHERE AccountNumber = '1000-QNB-01');
DECLARE @Acc2 BIGINT = (SELECT BankAccountId FROM banking.BankAccount WHERE AccountNumber = '2000-CBQ-02');
DECLARE @PerId INT = (SELECT TOP 1 ReportingPeriodId FROM rpt.ReportingPeriod);
DECLARE @VerId BIGINT = (SELECT TOP 1 ReportVersionId FROM rpt.ReportVersion);
DECLARE @CurId SMALLINT = (SELECT CurrencyId FROM ref.Currency WHERE CurrencyCode = 'QAR');

INSERT INTO banking.BankBalance (BankAccountId, ReportingPeriodId, ReportVersionId, BalanceDate, ClosingBalance, CurrencyId, ReportingCurrencyAmount, SourceType)
VALUES (@Acc1, @PerId, @VerId, '2026-08-15', 5.50, @CurId, 5.50, 'Manual');

INSERT INTO banking.BankBalance (BankAccountId, ReportingPeriodId, ReportVersionId, BalanceDate, ClosingBalance, CurrencyId, ReportingCurrencyAmount, SourceType)
VALUES (@Acc2, @PerId, @VerId, '2026-08-15', 1.60, @CurId, 1.60, 'Manual');

-- Seed Cash Flow Categories and Forecast
IF NOT EXISTS (SELECT 1 FROM treasury.CashFlowCategory WHERE CategoryCode = 'INFLOW_SALES')
BEGIN
    INSERT INTO treasury.CashFlowCategory (CategoryCode, CategoryName, DirectionCode, SequenceNo) VALUES ('INFLOW_SALES', 'Sales Receipts', 'IN', 1);
    INSERT INTO treasury.CashFlowCategory (CategoryCode, CategoryName, DirectionCode, SequenceNo) VALUES ('OUTFLOW_OPEX', 'Operating Expenses', 'OUT', 2);
END

DELETE FROM treasury.CashFlowForecast;
DECLARE @CatIn INT = (SELECT CashFlowCategoryId FROM treasury.CashFlowCategory WHERE CategoryCode = 'INFLOW_SALES');
DECLARE @CatOut INT = (SELECT CashFlowCategoryId FROM treasury.CashFlowCategory WHERE CategoryCode = 'OUTFLOW_OPEX');

INSERT INTO treasury.CashFlowForecast (ReportingPeriodId, ReportVersionId, BusinessUnitId, CashFlowCategoryId, BucketStartDate, BucketEndDate, Amount, CurrencyId, SourceType)
VALUES (@PerId, @VerId, 1, @CatIn, '2026-08-16', '2026-08-22', 12.5, @CurId, 'Manual');

INSERT INTO treasury.CashFlowForecast (ReportingPeriodId, ReportVersionId, BusinessUnitId, CashFlowCategoryId, BucketStartDate, BucketEndDate, Amount, CurrencyId, SourceType)
VALUES (@PerId, @VerId, 1, @CatOut, '2026-08-16', '2026-08-22', -8.0, @CurId, 'Manual');

INSERT INTO treasury.CashFlowForecast (ReportingPeriodId, ReportVersionId, BusinessUnitId, CashFlowCategoryId, BucketStartDate, BucketEndDate, Amount, CurrencyId, SourceType)
VALUES (@PerId, @VerId, 1, @CatIn, '2026-08-23', '2026-08-29', 15.0, @CurId, 'Manual');

INSERT INTO treasury.CashFlowForecast (ReportingPeriodId, ReportVersionId, BusinessUnitId, CashFlowCategoryId, BucketStartDate, BucketEndDate, Amount, CurrencyId, SourceType)
VALUES (@PerId, @VerId, 1, @CatOut, '2026-08-23', '2026-08-29', -14.5, @CurId, 'Manual');
GO
