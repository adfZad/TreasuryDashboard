USE TreasuryDB;
GO

DECLARE @PerId INT = (SELECT TOP 1 ReportingPeriodId FROM rpt.ReportingPeriod);
DECLARE @VerId BIGINT = (SELECT TOP 1 ReportVersionId FROM rpt.ReportVersion);
DECLARE @LoanId BIGINT = (SELECT TOP 1 LoanId FROM treasury.Loan);

-- Seed Loan Movement
DELETE FROM treasury.LoanMovementForecast;

INSERT INTO treasury.LoanMovementForecast (LoanId, ReportingPeriodId, ReportVersionId, BucketStartDate, BucketEndDate, OpeningOutstanding, PaymentAmount, NewDrawdownAmount, ClosingOutstanding)
VALUES (@LoanId, @PerId, @VerId, '2026-08-01', '2026-08-31', 180.0, 10.0, 0, 170.0);

INSERT INTO treasury.LoanMovementForecast (LoanId, ReportingPeriodId, ReportVersionId, BucketStartDate, BucketEndDate, OpeningOutstanding, PaymentAmount, NewDrawdownAmount, ClosingOutstanding)
VALUES (@LoanId, @PerId, @VerId, '2026-09-01', '2026-09-30', 170.0, 10.0, 50.0, 210.0);

INSERT INTO treasury.LoanMovementForecast (LoanId, ReportingPeriodId, ReportVersionId, BucketStartDate, BucketEndDate, OpeningOutstanding, PaymentAmount, NewDrawdownAmount, ClosingOutstanding)
VALUES (@LoanId, @PerId, @VerId, '2026-10-01', '2026-10-31', 210.0, 10.0, 0, 200.0);

-- Seed Roles
IF NOT EXISTS (SELECT 1 FROM sec.SecurityRole WHERE RoleCode = 'MAKER')
BEGIN
    INSERT INTO sec.SecurityRole (RoleCode, RoleName) VALUES ('MAKER', 'Maker');
    INSERT INTO sec.SecurityRole (RoleCode, RoleName) VALUES ('CHECKER', 'Checker');
END

-- Seed Users for Workflow
IF NOT EXISTS (SELECT 1 FROM sec.AppUser WHERE LoginName = 'treasury_maker')
BEGIN
    INSERT INTO sec.AppUser (LoginName, DisplayName, PasswordHash, PasswordAlgorithm) 
    VALUES ('treasury_maker', 'Ali (Maker)', 'dummy', 'none');
    
    INSERT INTO sec.AppUser (LoginName, DisplayName, PasswordHash, PasswordAlgorithm) 
    VALUES ('treasury_checker', 'Fatima (Checker)', 'dummy', 'none');
END

-- Seed Workflow and Comments
DELETE FROM workflow.WorkflowComment;
DELETE FROM workflow.WorkflowInstance;
DELETE FROM rpt.TreasurySubmission;

DECLARE @MakerId BIGINT = (SELECT AppUserId FROM sec.AppUser WHERE LoginName = 'treasury_maker');
DECLARE @CheckerId BIGINT = (SELECT AppUserId FROM sec.AppUser WHERE LoginName = 'treasury_checker');
DECLARE @BuId INT = (SELECT BusinessUnitId FROM org.BusinessUnit WHERE BusinessUnitCode = 'HQ');
DECLARE @MakerRoleId INT = (SELECT SecurityRoleId FROM sec.SecurityRole WHERE RoleCode = 'MAKER');
DECLARE @CheckerRoleId INT = (SELECT SecurityRoleId FROM sec.SecurityRole WHERE RoleCode = 'CHECKER');

INSERT INTO rpt.TreasurySubmission (ReportingPeriodId, ReportVersionId, BusinessUnitId, SubmissionStatus, CurrentStageCode)
VALUES (@PerId, @VerId, @BuId, 'UnderReview', 'REVIEW_LEVEL_1');

DECLARE @SubId BIGINT = SCOPE_IDENTITY();

INSERT INTO workflow.WorkflowInstance (ScopeType, TreasurySubmissionId, CurrentStageCode, WorkflowStatus)
VALUES ('BU', @SubId, 'REVIEW_LEVEL_1', 'Active');

INSERT INTO workflow.WorkflowComment (ReportingPeriodId, ReportVersionId, ModuleCode, CommentedByUserId, CommentedByRoleId, CommentText)
VALUES (@PerId, @VerId, 'FUNDS', @MakerId, @MakerRoleId, 'QNB balances uploaded and reconciled with GL.');

INSERT INTO workflow.WorkflowComment (ReportingPeriodId, ReportVersionId, ModuleCode, CommentedByUserId, CommentedByRoleId, CommentText)
VALUES (@PerId, @VerId, 'LOANS', @CheckerId, @CheckerRoleId, 'Please verify the upcoming repayment schedule for September.');
GO
