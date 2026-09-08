USE TreasuryDB;
GO

DECLARE @PerId INT = (SELECT TOP 1 ReportingPeriodId FROM rpt.ReportingPeriod);
DECLARE @VerId BIGINT = (SELECT TOP 1 ReportVersionId FROM rpt.ReportVersion);

DELETE FROM treasury.EquityValuation;

INSERT INTO treasury.EquityValuation (ReportingPeriodId, ReportVersionId, ValuationDate, OpeningBookValue, DividendPaid, CurrentFairValue, ClosingBookValue)
VALUES (@PerId, @VerId, '2026-08-15', 900.0, 0, 1200.0, 950.0);
GO
