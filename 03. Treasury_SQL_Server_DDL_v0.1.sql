/*
 Treasury Reporting & Dashboard Automation
 SQL Server starter DDL v0.1
 Prepared: 01 September 2026
 Source basis: Business Requirement Document V1.docx, FSD_Treasury_Report_Automation_v0.1.docx, Treasury report as on 15Aug2026.xlsx

 IMPORTANT: This is an implementation starter schema, not a production migration package.
 Open design items in the accompanying design document must be resolved before UAT/production.
 Amounts are stored in atomic currency units; QAR millions is a presentation convention only.
*/
SET NOCOUNT ON;
SET XACT_ABORT ON;
GO

IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = N'sec') EXEC(N'CREATE SCHEMA [sec]');
GO
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = N'ref') EXEC(N'CREATE SCHEMA [ref]');
GO
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = N'org') EXEC(N'CREATE SCHEMA [org]');
GO
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = N'rpt') EXEC(N'CREATE SCHEMA [rpt]');
GO
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = N'banking') EXEC(N'CREATE SCHEMA [banking]');
GO
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = N'treasury') EXEC(N'CREATE SCHEMA [treasury]');
GO
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = N'workflow') EXEC(N'CREATE SCHEMA [workflow]');
GO
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = N'ingest') EXEC(N'CREATE SCHEMA [ingest]');
GO
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = N'notify') EXEC(N'CREATE SCHEMA [notify]');
GO
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = N'audit') EXEC(N'CREATE SCHEMA [audit]');
GO
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = N'cfg') EXEC(N'CREATE SCHEMA [cfg]');
GO

-- sec.AppUser: Application credential and user status master.
CREATE TABLE [sec].[AppUser] (
    [AppUserId] bigint IDENTITY(1,1) NOT NULL,
    [LoginName] nvarchar(150) NOT NULL,
    [DisplayName] nvarchar(200) NOT NULL,
    [EmailAddress] nvarchar(254) NULL,
    [PasswordHash] nvarchar(512) NOT NULL,
    [PasswordAlgorithm] varchar(50) NOT NULL CONSTRAINT [DF_sec_AppUser_PasswordAlgorithm] DEFAULT ('PBKDF2/ASP.NET'),
    [PasswordChangedAtUtc] datetime2(0) NULL,
    [FailedLoginCount] int NOT NULL CONSTRAINT [DF_sec_AppUser_FailedLoginCount] DEFAULT (0),
    [LockoutUntilUtc] datetime2(0) NULL,
    [MustChangePassword] bit NOT NULL CONSTRAINT [DF_sec_AppUser_MustChangePassword] DEFAULT (0),
    [IsActive] bit NOT NULL CONSTRAINT [DF_sec_AppUser_IsActive] DEFAULT (1),
    [LastLoginAtUtc] datetime2(0) NULL,
    [CreatedAtUtc] datetime2(0) NOT NULL CONSTRAINT [DF_sec_AppUser_CreatedAtUtc] DEFAULT (SYSUTCDATETIME()),
    [CreatedByUserId] bigint NULL,
    [ModifiedAtUtc] datetime2(0) NULL,
    [ModifiedByUserId] bigint NULL,
    [RowVersion] rowversion,
    CONSTRAINT [PK_sec_AppUser] PRIMARY KEY CLUSTERED ([AppUserId])
);
GO

-- sec.SecurityRole: Application role master.
CREATE TABLE [sec].[SecurityRole] (
    [SecurityRoleId] int IDENTITY(1,1) NOT NULL,
    [RoleCode] varchar(50) NOT NULL,
    [RoleName] nvarchar(150) NOT NULL,
    [Description] nvarchar(500) NULL,
    [IsFinancialApprover] bit NOT NULL CONSTRAINT [DF_sec_SecurityRole_IsFinancialApprover] DEFAULT (0),
    [IsActive] bit NOT NULL CONSTRAINT [DF_sec_SecurityRole_IsActive] DEFAULT (1),
    [CreatedAtUtc] datetime2(0) NOT NULL CONSTRAINT [DF_sec_SecurityRole_CreatedAtUtc] DEFAULT (SYSUTCDATETIME()),
    [CreatedByUserId] bigint NULL,
    [ModifiedAtUtc] datetime2(0) NULL,
    [ModifiedByUserId] bigint NULL,
    [RowVersion] rowversion,
    CONSTRAINT [PK_sec_SecurityRole] PRIMARY KEY CLUSTERED ([SecurityRoleId])
);
GO

-- sec.Permission: Fine grained module/action permission master.
CREATE TABLE [sec].[Permission] (
    [PermissionId] int IDENTITY(1,1) NOT NULL,
    [PermissionCode] varchar(100) NOT NULL,
    [ModuleCode] varchar(50) NOT NULL,
    [ActionCode] varchar(50) NOT NULL,
    [Description] nvarchar(500) NULL,
    [IsActive] bit NOT NULL CONSTRAINT [DF_sec_Permission_IsActive] DEFAULT (1),
    [CreatedAtUtc] datetime2(0) NOT NULL CONSTRAINT [DF_sec_Permission_CreatedAtUtc] DEFAULT (SYSUTCDATETIME()),
    [CreatedByUserId] bigint NULL,
    [ModifiedAtUtc] datetime2(0) NULL,
    [ModifiedByUserId] bigint NULL,
    [RowVersion] rowversion,
    CONSTRAINT [PK_sec_Permission] PRIMARY KEY CLUSTERED ([PermissionId])
);
GO

-- sec.UserRole: Many-to-many mapping of users to roles.
CREATE TABLE [sec].[UserRole] (
    [AppUserId] bigint NOT NULL,
    [SecurityRoleId] int NOT NULL,
    [EffectiveFrom] date NULL,
    [EffectiveTo] date NULL,
    [IsActive] bit NOT NULL CONSTRAINT [DF_sec_UserRole_IsActive] DEFAULT (1),
    [CreatedAtUtc] datetime2(0) NOT NULL CONSTRAINT [DF_sec_UserRole_CreatedAtUtc] DEFAULT (SYSUTCDATETIME()),
    [CreatedByUserId] bigint NULL,
    CONSTRAINT [PK_sec_UserRole] PRIMARY KEY CLUSTERED ([AppUserId], [SecurityRoleId])
);
GO

-- sec.RolePermission: Many-to-many mapping of roles to permissions.
CREATE TABLE [sec].[RolePermission] (
    [SecurityRoleId] int NOT NULL,
    [PermissionId] int NOT NULL,
    [IsAllowed] bit NOT NULL CONSTRAINT [DF_sec_RolePermission_IsAllowed] DEFAULT (1),
    [CreatedAtUtc] datetime2(0) NOT NULL CONSTRAINT [DF_sec_RolePermission_CreatedAtUtc] DEFAULT (SYSUTCDATETIME()),
    [CreatedByUserId] bigint NULL,
    CONSTRAINT [PK_sec_RolePermission] PRIMARY KEY CLUSTERED ([SecurityRoleId], [PermissionId])
);
GO

-- ref.Country: Country reference master.
CREATE TABLE [ref].[Country] (
    [CountryId] smallint IDENTITY(1,1) NOT NULL,
    [CountryCode] char(2) NOT NULL,
    [CountryName] nvarchar(100) NOT NULL,
    [IsActive] bit NOT NULL CONSTRAINT [DF_ref_Country_IsActive] DEFAULT (1),
    [CreatedAtUtc] datetime2(0) NOT NULL CONSTRAINT [DF_ref_Country_CreatedAtUtc] DEFAULT (SYSUTCDATETIME()),
    [CreatedByUserId] bigint NULL,
    [ModifiedAtUtc] datetime2(0) NULL,
    [ModifiedByUserId] bigint NULL,
    [RowVersion] rowversion,
    CONSTRAINT [PK_ref_Country] PRIMARY KEY CLUSTERED ([CountryId])
);
GO

-- ref.Currency: Currency reference master.
CREATE TABLE [ref].[Currency] (
    [CurrencyId] smallint IDENTITY(1,1) NOT NULL,
    [CurrencyCode] char(3) NOT NULL,
    [CurrencyName] nvarchar(100) NULL,
    [DecimalPlaces] tinyint NOT NULL CONSTRAINT [DF_ref_Currency_DecimalPlaces] DEFAULT (2),
    [IsBaseCurrency] bit NOT NULL CONSTRAINT [DF_ref_Currency_IsBaseCurrency] DEFAULT (0),
    [IsActive] bit NOT NULL CONSTRAINT [DF_ref_Currency_IsActive] DEFAULT (1),
    [CreatedAtUtc] datetime2(0) NOT NULL CONSTRAINT [DF_ref_Currency_CreatedAtUtc] DEFAULT (SYSUTCDATETIME()),
    [CreatedByUserId] bigint NULL,
    [ModifiedAtUtc] datetime2(0) NULL,
    [ModifiedByUserId] bigint NULL,
    [RowVersion] rowversion,
    CONSTRAINT [PK_ref_Currency] PRIMARY KEY CLUSTERED ([CurrencyId])
);
GO

-- ref.Bank: Bank master used across accounts, facilities and borrowings.
CREATE TABLE [ref].[Bank] (
    [BankId] int IDENTITY(1,1) NOT NULL,
    [BankCode] varchar(30) NOT NULL,
    [BankName] nvarchar(200) NOT NULL,
    [CountryId] smallint NULL,
    [SwiftBIC] varchar(20) NULL,
    [IsActive] bit NOT NULL CONSTRAINT [DF_ref_Bank_IsActive] DEFAULT (1),
    [CreatedAtUtc] datetime2(0) NOT NULL CONSTRAINT [DF_ref_Bank_CreatedAtUtc] DEFAULT (SYSUTCDATETIME()),
    [CreatedByUserId] bigint NULL,
    [ModifiedAtUtc] datetime2(0) NULL,
    [ModifiedByUserId] bigint NULL,
    [RowVersion] rowversion,
    CONSTRAINT [PK_ref_Bank] PRIMARY KEY CLUSTERED ([BankId])
);
GO

-- ref.AccountType: Bank account type reference.
CREATE TABLE [ref].[AccountType] (
    [AccountTypeId] smallint IDENTITY(1,1) NOT NULL,
    [AccountTypeCode] varchar(30) NOT NULL,
    [AccountTypeName] nvarchar(100) NOT NULL,
    [IsActive] bit NOT NULL CONSTRAINT [DF_ref_AccountType_IsActive] DEFAULT (1),
    [CreatedAtUtc] datetime2(0) NOT NULL CONSTRAINT [DF_ref_AccountType_CreatedAtUtc] DEFAULT (SYSUTCDATETIME()),
    [CreatedByUserId] bigint NULL,
    [ModifiedAtUtc] datetime2(0) NULL,
    [ModifiedByUserId] bigint NULL,
    [RowVersion] rowversion,
    CONSTRAINT [PK_ref_AccountType] PRIMARY KEY CLUSTERED ([AccountTypeId])
);
GO

-- ref.FacilityType: Working capital/borrowing facility type reference.
CREATE TABLE [ref].[FacilityType] (
    [FacilityTypeId] smallint IDENTITY(1,1) NOT NULL,
    [FacilityTypeCode] varchar(30) NOT NULL,
    [FacilityTypeName] nvarchar(100) NOT NULL,
    [IsActive] bit NOT NULL CONSTRAINT [DF_ref_FacilityType_IsActive] DEFAULT (1),
    [CreatedAtUtc] datetime2(0) NOT NULL CONSTRAINT [DF_ref_FacilityType_CreatedAtUtc] DEFAULT (SYSUTCDATETIME()),
    [CreatedByUserId] bigint NULL,
    [ModifiedAtUtc] datetime2(0) NULL,
    [ModifiedByUserId] bigint NULL,
    [RowVersion] rowversion,
    CONSTRAINT [PK_ref_FacilityType] PRIMARY KEY CLUSTERED ([FacilityTypeId])
);
GO

-- ref.InvestmentType: Investment classification master.
CREATE TABLE [ref].[InvestmentType] (
    [InvestmentTypeId] smallint IDENTITY(1,1) NOT NULL,
    [InvestmentTypeCode] varchar(30) NOT NULL,
    [InvestmentTypeName] nvarchar(100) NOT NULL,
    [IsLiquidAsset] bit NOT NULL CONSTRAINT [DF_ref_InvestmentType_IsLiquidAsset] DEFAULT (0),
    [IsActive] bit NOT NULL CONSTRAINT [DF_ref_InvestmentType_IsActive] DEFAULT (1),
    [CreatedAtUtc] datetime2(0) NOT NULL CONSTRAINT [DF_ref_InvestmentType_CreatedAtUtc] DEFAULT (SYSUTCDATETIME()),
    [CreatedByUserId] bigint NULL,
    [ModifiedAtUtc] datetime2(0) NULL,
    [ModifiedByUserId] bigint NULL,
    [RowVersion] rowversion,
    CONSTRAINT [PK_ref_InvestmentType] PRIMARY KEY CLUSTERED ([InvestmentTypeId])
);
GO

-- ref.TreasuryCategory: Generic treasury category/reference master used for configurable classifications.
CREATE TABLE [ref].[TreasuryCategory] (
    [TreasuryCategoryId] int IDENTITY(1,1) NOT NULL,
    [CategoryGroup] varchar(50) NOT NULL,
    [CategoryCode] varchar(50) NOT NULL,
    [CategoryName] nvarchar(150) NOT NULL,
    [SequenceNo] int NOT NULL CONSTRAINT [DF_ref_TreasuryCategory_SequenceNo] DEFAULT (0),
    [IsActive] bit NOT NULL CONSTRAINT [DF_ref_TreasuryCategory_IsActive] DEFAULT (1),
    [CreatedAtUtc] datetime2(0) NOT NULL CONSTRAINT [DF_ref_TreasuryCategory_CreatedAtUtc] DEFAULT (SYSUTCDATETIME()),
    [CreatedByUserId] bigint NULL,
    [ModifiedAtUtc] datetime2(0) NULL,
    [ModifiedByUserId] bigint NULL,
    [RowVersion] rowversion,
    CONSTRAINT [PK_ref_TreasuryCategory] PRIMARY KEY CLUSTERED ([TreasuryCategoryId])
);
GO

-- org.Organization: Top-level organization master.
CREATE TABLE [org].[Organization] (
    [OrganizationId] int IDENTITY(1,1) NOT NULL,
    [OrganizationCode] varchar(30) NOT NULL,
    [OrganizationName] nvarchar(200) NOT NULL,
    [IsActive] bit NOT NULL CONSTRAINT [DF_org_Organization_IsActive] DEFAULT (1),
    [CreatedAtUtc] datetime2(0) NOT NULL CONSTRAINT [DF_org_Organization_CreatedAtUtc] DEFAULT (SYSUTCDATETIME()),
    [CreatedByUserId] bigint NULL,
    [ModifiedAtUtc] datetime2(0) NULL,
    [ModifiedByUserId] bigint NULL,
    [RowVersion] rowversion,
    CONSTRAINT [PK_org_Organization] PRIMARY KEY CLUSTERED ([OrganizationId])
);
GO

-- org.BusinessGroup: Business grouping below organization.
CREATE TABLE [org].[BusinessGroup] (
    [BusinessGroupId] int IDENTITY(1,1) NOT NULL,
    [OrganizationId] int NOT NULL,
    [BusinessGroupCode] varchar(30) NOT NULL,
    [BusinessGroupName] nvarchar(200) NOT NULL,
    [IsActive] bit NOT NULL CONSTRAINT [DF_org_BusinessGroup_IsActive] DEFAULT (1),
    [CreatedAtUtc] datetime2(0) NOT NULL CONSTRAINT [DF_org_BusinessGroup_CreatedAtUtc] DEFAULT (SYSUTCDATETIME()),
    [CreatedByUserId] bigint NULL,
    [ModifiedAtUtc] datetime2(0) NULL,
    [ModifiedByUserId] bigint NULL,
    [RowVersion] rowversion,
    CONSTRAINT [PK_org_BusinessGroup] PRIMARY KEY CLUSTERED ([BusinessGroupId])
);
GO

-- org.BusinessUnit: Business Unit master and primary row-level security dimension.
CREATE TABLE [org].[BusinessUnit] (
    [BusinessUnitId] int IDENTITY(1,1) NOT NULL,
    [BusinessGroupId] int NULL,
    [BusinessUnitCode] varchar(30) NOT NULL,
    [BusinessUnitName] nvarchar(200) NOT NULL,
    [CountryId] smallint NULL,
    [IsActive] bit NOT NULL CONSTRAINT [DF_org_BusinessUnit_IsActive] DEFAULT (1),
    [CreatedAtUtc] datetime2(0) NOT NULL CONSTRAINT [DF_org_BusinessUnit_CreatedAtUtc] DEFAULT (SYSUTCDATETIME()),
    [CreatedByUserId] bigint NULL,
    [ModifiedAtUtc] datetime2(0) NULL,
    [ModifiedByUserId] bigint NULL,
    [RowVersion] rowversion,
    CONSTRAINT [PK_org_BusinessUnit] PRIMARY KEY CLUSTERED ([BusinessUnitId])
);
GO

-- org.LegalEntity: Legal entity master owned by a Business Unit.
CREATE TABLE [org].[LegalEntity] (
    [LegalEntityId] int IDENTITY(1,1) NOT NULL,
    [BusinessUnitId] int NOT NULL,
    [LegalEntityCode] varchar(50) NOT NULL,
    [LegalName] nvarchar(250) NOT NULL,
    [CountryId] smallint NULL,
    [IsActive] bit NOT NULL CONSTRAINT [DF_org_LegalEntity_IsActive] DEFAULT (1),
    [CreatedAtUtc] datetime2(0) NOT NULL CONSTRAINT [DF_org_LegalEntity_CreatedAtUtc] DEFAULT (SYSUTCDATETIME()),
    [CreatedByUserId] bigint NULL,
    [ModifiedAtUtc] datetime2(0) NULL,
    [ModifiedByUserId] bigint NULL,
    [RowVersion] rowversion,
    CONSTRAINT [PK_org_LegalEntity] PRIMARY KEY CLUSTERED ([LegalEntityId])
);
GO

-- sec.UserBusinessUnit: User-to-BU access scope mapping.
CREATE TABLE [sec].[UserBusinessUnit] (
    [AppUserId] bigint NOT NULL,
    [BusinessUnitId] int NOT NULL,
    [AccessScope] varchar(20) NOT NULL CONSTRAINT [DF_sec_UserBusinessUnit_AccessScope] DEFAULT ('READ'),
    [EffectiveFrom] date NULL,
    [EffectiveTo] date NULL,
    [IsActive] bit NOT NULL CONSTRAINT [DF_sec_UserBusinessUnit_IsActive] DEFAULT (1),
    [CreatedAtUtc] datetime2(0) NOT NULL CONSTRAINT [DF_sec_UserBusinessUnit_CreatedAtUtc] DEFAULT (SYSUTCDATETIME()),
    [CreatedByUserId] bigint NULL,
    CONSTRAINT [PK_sec_UserBusinessUnit] PRIMARY KEY CLUSTERED ([AppUserId], [BusinessUnitId])
);
GO

-- rpt.ReportingPeriod: Controlled treasury reporting cycle.
CREATE TABLE [rpt].[ReportingPeriod] (
    [ReportingPeriodId] int IDENTITY(1,1) NOT NULL,
    [PeriodCode] varchar(20) NOT NULL,
    [PeriodName] nvarchar(100) NOT NULL,
    [ReportingDate] date NOT NULL,
    [SubmissionStartAt] datetime2(0) NOT NULL,
    [BUSubmissionDeadlineAt] datetime2(0) NOT NULL,
    [ReviewDeadlineAt] datetime2(0) NULL,
    [CFOApprovalDeadlineAt] datetime2(0) NULL,
    [PeriodStatus] varchar(30) NOT NULL,
    [ClosedAtUtc] datetime2(0) NULL,
    [PublishedAtUtc] datetime2(0) NULL,
    [CreatedAtUtc] datetime2(0) NOT NULL CONSTRAINT [DF_rpt_ReportingPeriod_CreatedAtUtc] DEFAULT (SYSUTCDATETIME()),
    [CreatedByUserId] bigint NULL,
    [ModifiedAtUtc] datetime2(0) NULL,
    [ModifiedByUserId] bigint NULL,
    [RowVersion] rowversion,
    CONSTRAINT [PK_rpt_ReportingPeriod] PRIMARY KEY CLUSTERED ([ReportingPeriodId])
);
GO

-- rpt.ReportVersion: Versioned financial position for a Reporting Period, including reopen lifecycle.
CREATE TABLE [rpt].[ReportVersion] (
    [ReportVersionId] bigint IDENTITY(1,1) NOT NULL,
    [ReportingPeriodId] int NOT NULL,
    [VersionNo] smallint NOT NULL,
    [VersionStatus] varchar(30) NOT NULL,
    [ReopenedFromVersionId] bigint NULL,
    [ReopenReason] nvarchar(1000) NULL,
    [LockedAtUtc] datetime2(0) NULL,
    [ApprovedByUserId] bigint NULL,
    [ApprovedAtUtc] datetime2(0) NULL,
    [CreatedAtUtc] datetime2(0) NOT NULL CONSTRAINT [DF_rpt_ReportVersion_CreatedAtUtc] DEFAULT (SYSUTCDATETIME()),
    [CreatedByUserId] bigint NULL,
    [ModifiedAtUtc] datetime2(0) NULL,
    [ModifiedByUserId] bigint NULL,
    [RowVersion] rowversion,
    CONSTRAINT [PK_rpt_ReportVersion] PRIMARY KEY CLUSTERED ([ReportVersionId])
);
GO

-- rpt.TreasurySubmission: BU reporting package and workflow anchor for a period/version.
CREATE TABLE [rpt].[TreasurySubmission] (
    [TreasurySubmissionId] bigint IDENTITY(1,1) NOT NULL,
    [ReportingPeriodId] int NOT NULL,
    [ReportVersionId] bigint NOT NULL,
    [BusinessUnitId] int NOT NULL,
    [SubmissionStatus] varchar(40) NOT NULL CONSTRAINT [DF_rpt_TreasurySubmission_SubmissionStatus] DEFAULT ('Draft'),
    [CurrentStageCode] varchar(40) NOT NULL CONSTRAINT [DF_rpt_TreasurySubmission_CurrentStageCode] DEFAULT ('DRAFT'),
    [SubmittedByUserId] bigint NULL,
    [SubmittedAtUtc] datetime2(0) NULL,
    [ReturnedAtUtc] datetime2(0) NULL,
    [CompletedAtUtc] datetime2(0) NULL,
    [CreatedAtUtc] datetime2(0) NOT NULL CONSTRAINT [DF_rpt_TreasurySubmission_CreatedAtUtc] DEFAULT (SYSUTCDATETIME()),
    [CreatedByUserId] bigint NULL,
    [ModifiedAtUtc] datetime2(0) NULL,
    [ModifiedByUserId] bigint NULL,
    [RowVersion] rowversion,
    CONSTRAINT [PK_rpt_TreasurySubmission] PRIMARY KEY CLUSTERED ([TreasurySubmissionId])
);
GO

-- banking.BankAccount: Central bank account master replacing one worksheet per account.
CREATE TABLE [banking].[BankAccount] (
    [BankAccountId] bigint IDENTITY(1,1) NOT NULL,
    [BusinessUnitId] int NOT NULL,
    [LegalEntityId] int NULL,
    [BankId] int NOT NULL,
    [BranchName] nvarchar(200) NULL,
    [AccountName] nvarchar(250) NULL,
    [AccountNumber] nvarchar(100) NOT NULL,
    [MaskedAccountNumber] nvarchar(100) NULL,
    [IBAN] nvarchar(64) NULL,
    [BIC] varchar(20) NULL,
    [CurrencyId] smallint NOT NULL,
    [AccountTypeId] smallint NULL,
    [OpenDate] date NULL,
    [CloseDate] date NULL,
    [IsActive] bit NOT NULL CONSTRAINT [DF_banking_BankAccount_IsActive] DEFAULT (1),
    [CreatedAtUtc] datetime2(0) NOT NULL CONSTRAINT [DF_banking_BankAccount_CreatedAtUtc] DEFAULT (SYSUTCDATETIME()),
    [CreatedByUserId] bigint NULL,
    [ModifiedAtUtc] datetime2(0) NULL,
    [ModifiedByUserId] bigint NULL,
    [RowVersion] rowversion,
    CONSTRAINT [PK_banking_BankAccount] PRIMARY KEY CLUSTERED ([BankAccountId])
);
GO

-- banking.BankBalance: Dated bank balance fact used by Funds Position and liquidity KPIs.
CREATE TABLE [banking].[BankBalance] (
    [BankBalanceId] bigint IDENTITY(1,1) NOT NULL,
    [BankAccountId] bigint NOT NULL,
    [ReportingPeriodId] int NOT NULL,
    [ReportVersionId] bigint NOT NULL,
    [BalanceDate] date NOT NULL,
    [OpeningBalance] decimal(19,4) NULL,
    [DebitMovement] decimal(19,4) NULL,
    [CreditMovement] decimal(19,4) NULL,
    [ClosingBalance] decimal(19,4) NOT NULL,
    [CurrencyId] smallint NOT NULL,
    [AppliedFXRateId] bigint NULL,
    [ReportingCurrencyAmount] decimal(19,4) NOT NULL,
    [SourceType] varchar(30) NOT NULL,
    [SourceReference] nvarchar(250) NULL,
    [SourceGeneratedAtUtc] datetime2(0) NULL,
    [UploadBatchId] bigint NULL,
    [CreatedAtUtc] datetime2(0) NOT NULL CONSTRAINT [DF_banking_BankBalance_CreatedAtUtc] DEFAULT (SYSUTCDATETIME()),
    [CreatedByUserId] bigint NULL,
    [ModifiedAtUtc] datetime2(0) NULL,
    [ModifiedByUserId] bigint NULL,
    [RowVersion] rowversion,
    CONSTRAINT [PK_banking_BankBalance] PRIMARY KEY CLUSTERED ([BankBalanceId])
);
GO

-- treasury.FXRate: Approved foreign exchange rate master by currency pair and effective date.
CREATE TABLE [treasury].[FXRate] (
    [FXRateId] bigint IDENTITY(1,1) NOT NULL,
    [FromCurrencyId] smallint NOT NULL,
    [ToCurrencyId] smallint NOT NULL,
    [ExchangeRate] decimal(19,8) NOT NULL,
    [EffectiveDate] date NOT NULL,
    [RateSource] nvarchar(200) NOT NULL,
    [ApprovalStatus] varchar(20) NOT NULL CONSTRAINT [DF_treasury_FXRate_ApprovalStatus] DEFAULT ('Draft'),
    [ApprovedByUserId] bigint NULL,
    [ApprovedAtUtc] datetime2(0) NULL,
    [CreatedAtUtc] datetime2(0) NOT NULL CONSTRAINT [DF_treasury_FXRate_CreatedAtUtc] DEFAULT (SYSUTCDATETIME()),
    [CreatedByUserId] bigint NULL,
    [ModifiedAtUtc] datetime2(0) NULL,
    [ModifiedByUserId] bigint NULL,
    [RowVersion] rowversion,
    CONSTRAINT [PK_treasury_FXRate] PRIMARY KEY CLUSTERED ([FXRateId])
);
GO

-- treasury.WorkingCapitalFacility: Central working capital facility master with support for shared/umbrella limits.
CREATE TABLE [treasury].[WorkingCapitalFacility] (
    [FacilityId] bigint IDENTITY(1,1) NOT NULL,
    [BusinessUnitId] int NULL,
    [LegalEntityId] int NULL,
    [BankId] int NOT NULL,
    [ParentFacilityId] bigint NULL,
    [FacilityTypeId] smallint NOT NULL,
    [FacilityReference] nvarchar(100) NULL,
    [CurrencyId] smallint NOT NULL,
    [SanctionedLimit] decimal(19,4) NOT NULL,
    [InterestRatePct] decimal(9,6) NULL,
    [BenchmarkRatePct] decimal(9,6) NULL,
    [SpreadPct] decimal(9,6) NULL,
    [EffectiveDate] date NULL,
    [ExpiryDate] date NULL,
    [SecurityText] nvarchar(1000) NULL,
    [CovenantText] nvarchar(2000) NULL,
    [IsSharedLimit] bit NOT NULL CONSTRAINT [DF_treasury_WorkingCapitalFacility_IsSharedLimit] DEFAULT (0),
    [FacilityStatus] varchar(20) NOT NULL CONSTRAINT [DF_treasury_WorkingCapitalFacility_FacilityStatus] DEFAULT ('Active'),
    [CreatedAtUtc] datetime2(0) NOT NULL CONSTRAINT [DF_treasury_WorkingCapitalFacility_CreatedAtUtc] DEFAULT (SYSUTCDATETIME()),
    [CreatedByUserId] bigint NULL,
    [ModifiedAtUtc] datetime2(0) NULL,
    [ModifiedByUserId] bigint NULL,
    [RowVersion] rowversion,
    CONSTRAINT [PK_treasury_WorkingCapitalFacility] PRIMARY KEY CLUSTERED ([FacilityId])
);
GO

-- treasury.FacilityUtilization: Reporting-date utilization of a working capital facility.
CREATE TABLE [treasury].[FacilityUtilization] (
    [FacilityUtilizationId] bigint IDENTITY(1,1) NOT NULL,
    [FacilityId] bigint NOT NULL,
    [ReportingPeriodId] int NOT NULL,
    [ReportVersionId] bigint NOT NULL,
    [AsOfDate] date NOT NULL,
    [UtilizedAmount] decimal(19,4) NOT NULL CONSTRAINT [DF_treasury_FacilityUtilization_UtilizedAmount] DEFAULT (0),
    [UnderProcessAmount] decimal(19,4) NOT NULL CONSTRAINT [DF_treasury_FacilityUtilization_UnderProcessAmount] DEFAULT (0),
    [AvailableAmount] decimal(19,4) NOT NULL,
    [UtilizationPct] decimal(9,6) NULL,
    [SourceType] varchar(30) NOT NULL,
    [UploadBatchId] bigint NULL,
    [CreatedAtUtc] datetime2(0) NOT NULL CONSTRAINT [DF_treasury_FacilityUtilization_CreatedAtUtc] DEFAULT (SYSUTCDATETIME()),
    [CreatedByUserId] bigint NULL,
    [ModifiedAtUtc] datetime2(0) NULL,
    [ModifiedByUserId] bigint NULL,
    [RowVersion] rowversion,
    CONSTRAINT [PK_treasury_FacilityUtilization] PRIMARY KEY CLUSTERED ([FacilityUtilizationId])
);
GO

-- treasury.FacilityApplication: Working capital financing application/expected approval record, primarily for QDB sections in current workbook.
CREATE TABLE [treasury].[FacilityApplication] (
    [FacilityApplicationId] bigint IDENTITY(1,1) NOT NULL,
    [ReportingPeriodId] int NOT NULL,
    [ReportVersionId] bigint NOT NULL,
    [BusinessUnitId] int NOT NULL,
    [BankId] int NOT NULL,
    [FacilityTypeId] smallint NULL,
    [ApplicationType] varchar(30) NOT NULL,
    [AppliedAmount] decimal(19,4) NOT NULL CONSTRAINT [DF_treasury_FacilityApplication_AppliedAmount] DEFAULT (0),
    [ExpectedApprovalAmount] decimal(19,4) NULL,
    [ApprovedAmount] decimal(19,4) NULL,
    [UtilizedAmount] decimal(19,4) NULL,
    [ApplicationStatus] varchar(30) NOT NULL CONSTRAINT [DF_treasury_FacilityApplication_ApplicationStatus] DEFAULT ('Applied'),
    [CreatedAtUtc] datetime2(0) NOT NULL CONSTRAINT [DF_treasury_FacilityApplication_CreatedAtUtc] DEFAULT (SYSUTCDATETIME()),
    [CreatedByUserId] bigint NULL,
    [ModifiedAtUtc] datetime2(0) NULL,
    [ModifiedByUserId] bigint NULL,
    [RowVersion] rowversion,
    CONSTRAINT [PK_treasury_FacilityApplication] PRIMARY KEY CLUSTERED ([FacilityApplicationId])
);
GO

-- treasury.Loan: Central loan/borrowing master for short-term and long-term borrowings.
CREATE TABLE [treasury].[Loan] (
    [LoanId] bigint IDENTITY(1,1) NOT NULL,
    [BusinessUnitId] int NULL,
    [LegalEntityId] int NULL,
    [BorrowerName] nvarchar(250) NULL,
    [BankId] int NULL,
    [LenderName] nvarchar(250) NOT NULL,
    [LoanReference] nvarchar(100) NOT NULL,
    [LoanTypeCode] varchar(20) NOT NULL,
    [FacilityTypeId] smallint NULL,
    [CurrencyId] smallint NOT NULL,
    [OriginalLoanAmount] decimal(19,4) NOT NULL,
    [CurrentOutstanding] decimal(19,4) NOT NULL,
    [StartDate] date NULL,
    [MaturityDate] date NULL,
    [InterestType] varchar(30) NULL,
    [InterestRatePct] decimal(9,6) NULL,
    [BenchmarkRatePct] decimal(9,6) NULL,
    [SpreadPct] decimal(9,6) NULL,
    [RepaymentFrequency] varchar(30) NULL,
    [SecurityText] nvarchar(1000) NULL,
    [CovenantText] nvarchar(2000) NULL,
    [LoanStatus] varchar(30) NOT NULL CONSTRAINT [DF_treasury_Loan_LoanStatus] DEFAULT ('Active'),
    [CreatedAtUtc] datetime2(0) NOT NULL CONSTRAINT [DF_treasury_Loan_CreatedAtUtc] DEFAULT (SYSUTCDATETIME()),
    [CreatedByUserId] bigint NULL,
    [ModifiedAtUtc] datetime2(0) NULL,
    [ModifiedByUserId] bigint NULL,
    [RowVersion] rowversion,
    CONSTRAINT [PK_treasury_Loan] PRIMARY KEY CLUSTERED ([LoanId])
);
GO

-- treasury.LoanRepayment: Dated principal/interest repayment schedule and actual payment tracking.
CREATE TABLE [treasury].[LoanRepayment] (
    [LoanRepaymentId] bigint IDENTITY(1,1) NOT NULL,
    [LoanId] bigint NOT NULL,
    [ReportingPeriodId] int NULL,
    [ReportVersionId] bigint NULL,
    [DueDate] date NOT NULL,
    [PrincipalAmount] decimal(19,4) NOT NULL CONSTRAINT [DF_treasury_LoanRepayment_PrincipalAmount] DEFAULT (0),
    [InterestAmount] decimal(19,4) NOT NULL CONSTRAINT [DF_treasury_LoanRepayment_InterestAmount] DEFAULT (0),
    [PaidAmount] decimal(19,4) NOT NULL CONSTRAINT [DF_treasury_LoanRepayment_PaidAmount] DEFAULT (0),
    [PaidDate] date NULL,
    [RepaymentStatus] varchar(20) NOT NULL CONSTRAINT [DF_treasury_LoanRepayment_RepaymentStatus] DEFAULT ('Scheduled'),
    [SourceReference] nvarchar(250) NULL,
    [CreatedAtUtc] datetime2(0) NOT NULL CONSTRAINT [DF_treasury_LoanRepayment_CreatedAtUtc] DEFAULT (SYSUTCDATETIME()),
    [CreatedByUserId] bigint NULL,
    [ModifiedAtUtc] datetime2(0) NULL,
    [ModifiedByUserId] bigint NULL,
    [RowVersion] rowversion,
    CONSTRAINT [PK_treasury_LoanRepayment] PRIMARY KEY CLUSTERED ([LoanRepaymentId])
);
GO

-- treasury.LoanMovementForecast: Versioned future loan movement schedule replacing month columns in the workbook.
CREATE TABLE [treasury].[LoanMovementForecast] (
    [LoanMovementForecastId] bigint IDENTITY(1,1) NOT NULL,
    [LoanId] bigint NOT NULL,
    [ReportingPeriodId] int NOT NULL,
    [ReportVersionId] bigint NOT NULL,
    [BucketStartDate] date NOT NULL,
    [BucketEndDate] date NOT NULL,
    [OpeningOutstanding] decimal(19,4) NOT NULL,
    [PaymentAmount] decimal(19,4) NOT NULL CONSTRAINT [DF_treasury_LoanMovementForecast_PaymentAmount] DEFAULT (0),
    [NewDrawdownAmount] decimal(19,4) NOT NULL CONSTRAINT [DF_treasury_LoanMovementForecast_NewDrawdownAmount] DEFAULT (0),
    [ClosingOutstanding] decimal(19,4) NOT NULL,
    [CreatedAtUtc] datetime2(0) NOT NULL CONSTRAINT [DF_treasury_LoanMovementForecast_CreatedAtUtc] DEFAULT (SYSUTCDATETIME()),
    [CreatedByUserId] bigint NULL,
    [ModifiedAtUtc] datetime2(0) NULL,
    [ModifiedByUserId] bigint NULL,
    [RowVersion] rowversion,
    CONSTRAINT [PK_treasury_LoanMovementForecast] PRIMARY KEY CLUSTERED ([LoanMovementForecastId])
);
GO

-- treasury.Investment: Investment master covering shares, metals and fixed deposits.
CREATE TABLE [treasury].[Investment] (
    [InvestmentId] bigint IDENTITY(1,1) NOT NULL,
    [BusinessUnitId] int NULL,
    [LegalEntityId] int NULL,
    [InvestmentTypeId] smallint NOT NULL,
    [InstrumentName] nvarchar(250) NOT NULL,
    [CountryId] smallint NULL,
    [Quantity] decimal(28,8) NULL,
    [AcquisitionCost] decimal(19,4) NOT NULL,
    [CurrencyId] smallint NOT NULL,
    [PlacementDate] date NULL,
    [MaturityDate] date NULL,
    [InterestRatePct] decimal(9,6) NULL,
    [InvestmentStatus] varchar(30) NOT NULL CONSTRAINT [DF_treasury_Investment_InvestmentStatus] DEFAULT ('Active'),
    [CreatedAtUtc] datetime2(0) NOT NULL CONSTRAINT [DF_treasury_Investment_CreatedAtUtc] DEFAULT (SYSUTCDATETIME()),
    [CreatedByUserId] bigint NULL,
    [ModifiedAtUtc] datetime2(0) NULL,
    [ModifiedByUserId] bigint NULL,
    [RowVersion] rowversion,
    CONSTRAINT [PK_treasury_Investment] PRIMARY KEY CLUSTERED ([InvestmentId])
);
GO

-- treasury.InvestmentValuation: Dated market valuation for investments.
CREATE TABLE [treasury].[InvestmentValuation] (
    [InvestmentValuationId] bigint IDENTITY(1,1) NOT NULL,
    [InvestmentId] bigint NOT NULL,
    [ReportingPeriodId] int NOT NULL,
    [ReportVersionId] bigint NOT NULL,
    [ValuationDate] date NOT NULL,
    [MarketPrice] decimal(28,8) NULL,
    [CurrentMarketValue] decimal(19,4) NOT NULL,
    [UnrealizedGainLoss] decimal(19,4) NULL,
    [RateSource] nvarchar(200) NULL,
    [AppliedFXRateId] bigint NULL,
    [ReportingCurrencyValue] decimal(19,4) NULL,
    [CreatedAtUtc] datetime2(0) NOT NULL CONSTRAINT [DF_treasury_InvestmentValuation_CreatedAtUtc] DEFAULT (SYSUTCDATETIME()),
    [CreatedByUserId] bigint NULL,
    [ModifiedAtUtc] datetime2(0) NULL,
    [ModifiedByUserId] bigint NULL,
    [RowVersion] rowversion,
    CONSTRAINT [PK_treasury_InvestmentValuation] PRIMARY KEY CLUSTERED ([InvestmentValuationId])
);
GO

-- treasury.EquityValuation: Group/BU equity book value bridge required to reproduce the workbook Debt-to-Equity KPI.
CREATE TABLE [treasury].[EquityValuation] (
    [EquityValuationId] bigint IDENTITY(1,1) NOT NULL,
    [ReportingPeriodId] int NOT NULL,
    [ReportVersionId] bigint NOT NULL,
    [BusinessUnitId] int NULL,
    [ValuationDate] date NOT NULL,
    [OpeningBookValue] decimal(19,4) NOT NULL,
    [DividendPaid] decimal(19,4) NOT NULL CONSTRAINT [DF_treasury_EquityValuation_DividendPaid] DEFAULT (0),
    [PreviousFairValue] decimal(19,4) NULL,
    [CurrentFairValue] decimal(19,4) NULL,
    [FairValueGainLoss] decimal(19,4) NULL,
    [AverageEBDAAdjustment] decimal(19,4) NULL,
    [ClosingBookValue] decimal(19,4) NOT NULL,
    [CreatedAtUtc] datetime2(0) NOT NULL CONSTRAINT [DF_treasury_EquityValuation_CreatedAtUtc] DEFAULT (SYSUTCDATETIME()),
    [CreatedByUserId] bigint NULL,
    [ModifiedAtUtc] datetime2(0) NULL,
    [ModifiedByUserId] bigint NULL,
    [RowVersion] rowversion,
    CONSTRAINT [PK_treasury_EquityValuation] PRIMARY KEY CLUSTERED ([EquityValuationId])
);
GO

-- treasury.CashFlowCategory: Configurable cash flow category master.
CREATE TABLE [treasury].[CashFlowCategory] (
    [CashFlowCategoryId] int IDENTITY(1,1) NOT NULL,
    [CategoryCode] varchar(50) NOT NULL,
    [CategoryName] nvarchar(150) NOT NULL,
    [DirectionCode] varchar(10) NOT NULL,
    [SequenceNo] int NOT NULL CONSTRAINT [DF_treasury_CashFlowCategory_SequenceNo] DEFAULT (0),
    [IsMandatory] bit NOT NULL CONSTRAINT [DF_treasury_CashFlowCategory_IsMandatory] DEFAULT (0),
    [IsActive] bit NOT NULL CONSTRAINT [DF_treasury_CashFlowCategory_IsActive] DEFAULT (1),
    [CreatedAtUtc] datetime2(0) NOT NULL CONSTRAINT [DF_treasury_CashFlowCategory_CreatedAtUtc] DEFAULT (SYSUTCDATETIME()),
    [CreatedByUserId] bigint NULL,
    [ModifiedAtUtc] datetime2(0) NULL,
    [ModifiedByUserId] bigint NULL,
    [RowVersion] rowversion,
    CONSTRAINT [PK_treasury_CashFlowCategory] PRIMARY KEY CLUSTERED ([CashFlowCategoryId])
);
GO

-- treasury.CashFlowForecast: BU cash flow forecast by category and weekly/monthly bucket.
CREATE TABLE [treasury].[CashFlowForecast] (
    [CashFlowForecastId] bigint IDENTITY(1,1) NOT NULL,
    [ReportingPeriodId] int NOT NULL,
    [ReportVersionId] bigint NOT NULL,
    [BusinessUnitId] int NOT NULL,
    [CashFlowCategoryId] int NOT NULL,
    [BucketStartDate] date NOT NULL,
    [BucketEndDate] date NOT NULL,
    [BucketType] varchar(10) NOT NULL CONSTRAINT [DF_treasury_CashFlowForecast_BucketType] DEFAULT ('WEEK'),
    [Amount] decimal(19,4) NOT NULL,
    [CurrencyId] smallint NOT NULL,
    [SourceType] varchar(30) NOT NULL,
    [UploadBatchId] bigint NULL,
    [CreatedAtUtc] datetime2(0) NOT NULL CONSTRAINT [DF_treasury_CashFlowForecast_CreatedAtUtc] DEFAULT (SYSUTCDATETIME()),
    [CreatedByUserId] bigint NULL,
    [ModifiedAtUtc] datetime2(0) NULL,
    [ModifiedByUserId] bigint NULL,
    [RowVersion] rowversion,
    CONSTRAINT [PK_treasury_CashFlowForecast] PRIMARY KEY CLUSTERED ([CashFlowForecastId])
);
GO

-- treasury.LiquidityAdjustment: Explicit approved adjustment replacing hidden/manual reserve and summary adjustments in the workbook.
CREATE TABLE [treasury].[LiquidityAdjustment] (
    [LiquidityAdjustmentId] bigint IDENTITY(1,1) NOT NULL,
    [ReportingPeriodId] int NOT NULL,
    [ReportVersionId] bigint NOT NULL,
    [BusinessUnitId] int NULL,
    [AdjustmentType] varchar(50) NOT NULL,
    [Amount] decimal(19,4) NOT NULL,
    [CurrencyId] smallint NOT NULL,
    [Reason] nvarchar(1000) NOT NULL,
    [ApprovalStatus] varchar(20) NOT NULL CONSTRAINT [DF_treasury_LiquidityAdjustment_ApprovalStatus] DEFAULT ('Draft'),
    [ApprovedByUserId] bigint NULL,
    [ApprovedAtUtc] datetime2(0) NULL,
    [SourceReference] nvarchar(250) NULL,
    [CreatedAtUtc] datetime2(0) NOT NULL CONSTRAINT [DF_treasury_LiquidityAdjustment_CreatedAtUtc] DEFAULT (SYSUTCDATETIME()),
    [CreatedByUserId] bigint NULL,
    [ModifiedAtUtc] datetime2(0) NULL,
    [ModifiedByUserId] bigint NULL,
    [RowVersion] rowversion,
    CONSTRAINT [PK_treasury_LiquidityAdjustment] PRIMARY KEY CLUSTERED ([LiquidityAdjustmentId])
);
GO

-- workflow.WorkflowInstance: Workflow state container for BU submission or Group report version.
CREATE TABLE [workflow].[WorkflowInstance] (
    [WorkflowInstanceId] bigint IDENTITY(1,1) NOT NULL,
    [ScopeType] varchar(10) NOT NULL,
    [TreasurySubmissionId] bigint NULL,
    [ReportVersionId] bigint NULL,
    [CurrentStageCode] varchar(40) NOT NULL,
    [WorkflowStatus] varchar(30) NOT NULL CONSTRAINT [DF_workflow_WorkflowInstance_WorkflowStatus] DEFAULT ('Active'),
    [StartedAtUtc] datetime2(0) NOT NULL CONSTRAINT [DF_workflow_WorkflowInstance_StartedAtUtc] DEFAULT (SYSUTCDATETIME()),
    [CompletedAtUtc] datetime2(0) NULL,
    [CreatedAtUtc] datetime2(0) NOT NULL CONSTRAINT [DF_workflow_WorkflowInstance_CreatedAtUtc] DEFAULT (SYSUTCDATETIME()),
    [CreatedByUserId] bigint NULL,
    [ModifiedAtUtc] datetime2(0) NULL,
    [ModifiedByUserId] bigint NULL,
    [RowVersion] rowversion,
    CONSTRAINT [PK_workflow_WorkflowInstance] PRIMARY KEY CLUSTERED ([WorkflowInstanceId])
);
GO

-- workflow.WorkflowAction: Immutable approval, return, submit, reopen and publish action history.
CREATE TABLE [workflow].[WorkflowAction] (
    [WorkflowActionId] bigint IDENTITY(1,1) NOT NULL,
    [WorkflowInstanceId] bigint NOT NULL,
    [StageCode] varchar(40) NOT NULL,
    [AppUserId] bigint NOT NULL,
    [SecurityRoleId] int NOT NULL,
    [ActionCode] varchar(30) NOT NULL,
    [CommentText] nvarchar(2000) NULL,
    [ReasonText] nvarchar(2000) NULL,
    [FromStatus] varchar(40) NULL,
    [ToStatus] varchar(40) NOT NULL,
    [ActionAtUtc] datetime2(0) NOT NULL CONSTRAINT [DF_workflow_WorkflowAction_ActionAtUtc] DEFAULT (SYSUTCDATETIME()),
    [CorrelationId] uniqueidentifier NOT NULL CONSTRAINT [DF_workflow_WorkflowAction_CorrelationId] DEFAULT (NEWID()),
    CONSTRAINT [PK_workflow_WorkflowAction] PRIMARY KEY CLUSTERED ([WorkflowActionId])
);
GO

-- workflow.WorkflowComment: Threaded business/reviewer comments tied to period, BU, module and data record.
CREATE TABLE [workflow].[WorkflowComment] (
    [WorkflowCommentId] bigint IDENTITY(1,1) NOT NULL,
    [ReportingPeriodId] int NOT NULL,
    [ReportVersionId] bigint NOT NULL,
    [BusinessUnitId] int NULL,
    [ModuleCode] varchar(50) NOT NULL,
    [RecordType] varchar(50) NULL,
    [RecordId] bigint NULL,
    [ParentCommentId] bigint NULL,
    [CommentedByUserId] bigint NOT NULL,
    [CommentedByRoleId] int NOT NULL,
    [CommentText] nvarchar(4000) NOT NULL,
    [CommentStatus] varchar(20) NOT NULL CONSTRAINT [DF_workflow_WorkflowComment_CommentStatus] DEFAULT ('Open'),
    [IsExecutiveVisible] bit NOT NULL CONSTRAINT [DF_workflow_WorkflowComment_IsExecutiveVisible] DEFAULT (0),
    [CreatedAtUtc] datetime2(0) NOT NULL CONSTRAINT [DF_workflow_WorkflowComment_CreatedAtUtc] DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT [PK_workflow_WorkflowComment] PRIMARY KEY CLUSTERED ([WorkflowCommentId])
);
GO

-- workflow.TreasuryException: Validation/business exception register with severity and override controls.
CREATE TABLE [workflow].[TreasuryException] (
    [TreasuryExceptionId] bigint IDENTITY(1,1) NOT NULL,
    [ReportingPeriodId] int NOT NULL,
    [ReportVersionId] bigint NOT NULL,
    [BusinessUnitId] int NULL,
    [ModuleCode] varchar(50) NOT NULL,
    [RecordType] varchar(50) NULL,
    [RecordId] bigint NULL,
    [RuleCode] varchar(50) NOT NULL,
    [SeverityCode] varchar(20) NOT NULL,
    [Description] nvarchar(2000) NOT NULL,
    [ExceptionStatus] varchar(20) NOT NULL CONSTRAINT [DF_workflow_TreasuryException_ExceptionStatus] DEFAULT ('Open'),
    [IsBlocking] bit NOT NULL CONSTRAINT [DF_workflow_TreasuryException_IsBlocking] DEFAULT (0),
    [OwnerUserId] bigint NULL,
    [OverrideByUserId] bigint NULL,
    [OverrideAtUtc] datetime2(0) NULL,
    [OverrideReason] nvarchar(2000) NULL,
    [ResolvedAtUtc] datetime2(0) NULL,
    [CreatedAtUtc] datetime2(0) NOT NULL CONSTRAINT [DF_workflow_TreasuryException_CreatedAtUtc] DEFAULT (SYSUTCDATETIME()),
    [CreatedByUserId] bigint NULL,
    CONSTRAINT [PK_workflow_TreasuryException] PRIMARY KEY CLUSTERED ([TreasuryExceptionId])
);
GO

-- ingest.UploadTemplate: Approved standardized Excel upload template definition and version.
CREATE TABLE [ingest].[UploadTemplate] (
    [UploadTemplateId] int IDENTITY(1,1) NOT NULL,
    [ModuleCode] varchar(50) NOT NULL,
    [TemplateName] nvarchar(150) NOT NULL,
    [TemplateVersion] varchar(20) NOT NULL,
    [HeaderRowNo] int NOT NULL CONSTRAINT [DF_ingest_UploadTemplate_HeaderRowNo] DEFAULT (1),
    [TemplateHash] varchar(64) NULL,
    [EffectiveFrom] date NULL,
    [EffectiveTo] date NULL,
    [IsActive] bit NOT NULL CONSTRAINT [DF_ingest_UploadTemplate_IsActive] DEFAULT (1),
    [CreatedAtUtc] datetime2(0) NOT NULL CONSTRAINT [DF_ingest_UploadTemplate_CreatedAtUtc] DEFAULT (SYSUTCDATETIME()),
    [CreatedByUserId] bigint NULL,
    [ModifiedAtUtc] datetime2(0) NULL,
    [ModifiedByUserId] bigint NULL,
    [RowVersion] rowversion,
    CONSTRAINT [PK_ingest_UploadTemplate] PRIMARY KEY CLUSTERED ([UploadTemplateId])
);
GO

-- ingest.UploadTemplateColumn: Expected column definition for upload structure validation.
CREATE TABLE [ingest].[UploadTemplateColumn] (
    [UploadTemplateColumnId] int IDENTITY(1,1) NOT NULL,
    [UploadTemplateId] int NOT NULL,
    [ColumnOrdinal] int NOT NULL,
    [ColumnName] nvarchar(150) NOT NULL,
    [TargetField] nvarchar(150) NOT NULL,
    [DataTypeCode] varchar(30) NOT NULL,
    [IsRequired] bit NOT NULL CONSTRAINT [DF_ingest_UploadTemplateColumn_IsRequired] DEFAULT (0),
    [MaxLength] int NULL,
    [ValidationRuleCode] varchar(50) NULL,
    [CreatedAtUtc] datetime2(0) NOT NULL CONSTRAINT [DF_ingest_UploadTemplateColumn_CreatedAtUtc] DEFAULT (SYSUTCDATETIME()),
    [CreatedByUserId] bigint NULL,
    [ModifiedAtUtc] datetime2(0) NULL,
    [ModifiedByUserId] bigint NULL,
    [RowVersion] rowversion,
    CONSTRAINT [PK_ingest_UploadTemplateColumn] PRIMARY KEY CLUSTERED ([UploadTemplateColumnId])
);
GO

-- ingest.UploadBatch: Uploaded file header, lineage and validation summary.
CREATE TABLE [ingest].[UploadBatch] (
    [UploadBatchId] bigint IDENTITY(1,1) NOT NULL,
    [ReportingPeriodId] int NOT NULL,
    [ReportVersionId] bigint NOT NULL,
    [BusinessUnitId] int NULL,
    [ModuleCode] varchar(50) NOT NULL,
    [UploadTemplateId] int NULL,
    [TemplateVersion] varchar(20) NULL,
    [OriginalFileName] nvarchar(260) NOT NULL,
    [FileHash] varchar(64) NOT NULL,
    [FileSizeBytes] bigint NOT NULL,
    [UploadedByUserId] bigint NOT NULL,
    [UploadedAtUtc] datetime2(0) NOT NULL CONSTRAINT [DF_ingest_UploadBatch_UploadedAtUtc] DEFAULT (SYSUTCDATETIME()),
    [BatchStatus] varchar(30) NOT NULL CONSTRAINT [DF_ingest_UploadBatch_BatchStatus] DEFAULT ('Uploaded'),
    [TotalRows] int NOT NULL CONSTRAINT [DF_ingest_UploadBatch_TotalRows] DEFAULT (0),
    [ValidRows] int NOT NULL CONSTRAINT [DF_ingest_UploadBatch_ValidRows] DEFAULT (0),
    [InvalidRows] int NOT NULL CONSTRAINT [DF_ingest_UploadBatch_InvalidRows] DEFAULT (0),
    [ImportedRows] int NOT NULL CONSTRAINT [DF_ingest_UploadBatch_ImportedRows] DEFAULT (0),
    CONSTRAINT [PK_ingest_UploadBatch] PRIMARY KEY CLUSTERED ([UploadBatchId])
);
GO

-- ingest.UploadDetail: Staging row preserving raw source values and import result.
CREATE TABLE [ingest].[UploadDetail] (
    [UploadDetailId] bigint IDENTITY(1,1) NOT NULL,
    [UploadBatchId] bigint NOT NULL,
    [SourceRowNo] int NOT NULL,
    [RawPayloadJson] nvarchar(max) NOT NULL,
    [NormalizedPayloadJson] nvarchar(max) NULL,
    [RowHash] varchar(64) NULL,
    [ImportStatus] varchar(20) NOT NULL CONSTRAINT [DF_ingest_UploadDetail_ImportStatus] DEFAULT ('Pending'),
    [TargetRecordType] varchar(50) NULL,
    [TargetRecordId] bigint NULL,
    [ImportedAtUtc] datetime2(0) NULL,
    CONSTRAINT [PK_ingest_UploadDetail] PRIMARY KEY CLUSTERED ([UploadDetailId])
);
GO

-- ingest.ValidationError: Row/record level validation result with field and reason.
CREATE TABLE [ingest].[ValidationError] (
    [ValidationErrorId] bigint IDENTITY(1,1) NOT NULL,
    [UploadBatchId] bigint NULL,
    [UploadDetailId] bigint NULL,
    [ReportingPeriodId] int NULL,
    [ReportVersionId] bigint NULL,
    [RecordType] varchar(50) NULL,
    [RecordId] bigint NULL,
    [RuleCode] varchar(50) NOT NULL,
    [SourceRowNo] int NULL,
    [FieldName] nvarchar(150) NULL,
    [MessageText] nvarchar(2000) NOT NULL,
    [SeverityCode] varchar(20) NOT NULL,
    [ValidationStatus] varchar(20) NOT NULL CONSTRAINT [DF_ingest_ValidationError_ValidationStatus] DEFAULT ('Open'),
    [CreatedAtUtc] datetime2(0) NOT NULL CONSTRAINT [DF_ingest_ValidationError_CreatedAtUtc] DEFAULT (SYSUTCDATETIME()),
    [ResolvedAtUtc] datetime2(0) NULL,
    CONSTRAINT [PK_ingest_ValidationError] PRIMARY KEY CLUSTERED ([ValidationErrorId])
);
GO

-- ingest.Attachment: Supporting document metadata linked to period/module/record.
CREATE TABLE [ingest].[Attachment] (
    [AttachmentId] bigint IDENTITY(1,1) NOT NULL,
    [ReportingPeriodId] int NOT NULL,
    [ReportVersionId] bigint NOT NULL,
    [BusinessUnitId] int NULL,
    [ModuleCode] varchar(50) NOT NULL,
    [RecordType] varchar(50) NULL,
    [RecordId] bigint NULL,
    [OriginalFileName] nvarchar(260) NOT NULL,
    [ContentType] nvarchar(100) NOT NULL,
    [FileSizeBytes] bigint NOT NULL,
    [FileHash] varchar(64) NOT NULL,
    [StorageReference] nvarchar(500) NOT NULL,
    [UploadedByUserId] bigint NOT NULL,
    [UploadedAtUtc] datetime2(0) NOT NULL CONSTRAINT [DF_ingest_Attachment_UploadedAtUtc] DEFAULT (SYSUTCDATETIME()),
    [IsActive] bit NOT NULL CONSTRAINT [DF_ingest_Attachment_IsActive] DEFAULT (1),
    CONSTRAINT [PK_ingest_Attachment] PRIMARY KEY CLUSTERED ([AttachmentId])
);
GO

-- rpt.TreasurySnapshot: Immutable manifest for a CFO-approved report version.
CREATE TABLE [rpt].[TreasurySnapshot] (
    [TreasurySnapshotId] bigint IDENTITY(1,1) NOT NULL,
    [ReportingPeriodId] int NOT NULL,
    [ReportVersionId] bigint NOT NULL,
    [SnapshotStatus] varchar(20) NOT NULL CONSTRAINT [DF_rpt_TreasurySnapshot_SnapshotStatus] DEFAULT ('Approved'),
    [ApprovedByUserId] bigint NOT NULL,
    [ApprovedAtUtc] datetime2(0) NOT NULL,
    [PublishedByUserId] bigint NULL,
    [PublishedAtUtc] datetime2(0) NULL,
    [AudienceScope] varchar(30) NOT NULL CONSTRAINT [DF_rpt_TreasurySnapshot_AudienceScope] DEFAULT ('CFO_ONLY'),
    [DataHash] varchar(64) NOT NULL,
    [SourceCutoffAtUtc] datetime2(0) NOT NULL,
    CONSTRAINT [PK_rpt_TreasurySnapshot] PRIMARY KEY CLUSTERED ([TreasurySnapshotId])
);
GO

-- rpt.SnapshotKPI: Immutable KPI values captured from approved source data.
CREATE TABLE [rpt].[SnapshotKPI] (
    [SnapshotKPIId] bigint IDENTITY(1,1) NOT NULL,
    [TreasurySnapshotId] bigint NOT NULL,
    [KPIKey] varchar(60) NOT NULL,
    [DimensionType] varchar(30) NULL,
    [DimensionKey] nvarchar(100) NULL,
    [DimensionLabel] nvarchar(250) NULL,
    [CurrencyCode] char(3) NULL,
    [NumericValue] decimal(28,8) NULL,
    [DisplayValue] nvarchar(100) NULL,
    [DisplayUnit] varchar(30) NULL,
    [SortOrder] int NOT NULL CONSTRAINT [DF_rpt_SnapshotKPI_SortOrder] DEFAULT (0),
    CONSTRAINT [PK_rpt_SnapshotKPI] PRIMARY KEY CLUSTERED ([SnapshotKPIId])
);
GO

-- rpt.SnapshotDetail: Immutable denormalized module detail enabling historical drill-down even after master data changes.
CREATE TABLE [rpt].[SnapshotDetail] (
    [SnapshotDetailId] bigint IDENTITY(1,1) NOT NULL,
    [TreasurySnapshotId] bigint NOT NULL,
    [ModuleCode] varchar(50) NOT NULL,
    [RecordType] varchar(50) NOT NULL,
    [SourceRecordId] bigint NULL,
    [BusinessUnitCode] varchar(30) NULL,
    [LegalEntityLabel] nvarchar(250) NULL,
    [BankLabel] nvarchar(200) NULL,
    [CurrencyCode] char(3) NULL,
    [RecordPayloadJson] nvarchar(max) NOT NULL,
    [RecordHash] varchar(64) NOT NULL,
    CONSTRAINT [PK_rpt_SnapshotDetail] PRIMARY KEY CLUSTERED ([SnapshotDetailId])
);
GO

-- rpt.SnapshotComment: Immutable management/executive commentary captured at approval.
CREATE TABLE [rpt].[SnapshotComment] (
    [SnapshotCommentId] bigint IDENTITY(1,1) NOT NULL,
    [TreasurySnapshotId] bigint NOT NULL,
    [ModuleCode] varchar(50) NOT NULL,
    [BusinessUnitCode] varchar(30) NULL,
    [CommentText] nvarchar(4000) NOT NULL,
    [CommentedByName] nvarchar(200) NOT NULL,
    [CommentedByRole] nvarchar(150) NOT NULL,
    [CommentedAtUtc] datetime2(0) NOT NULL,
    [SequenceNo] int NOT NULL CONSTRAINT [DF_rpt_SnapshotComment_SequenceNo] DEFAULT (0),
    CONSTRAINT [PK_rpt_SnapshotComment] PRIMARY KEY CLUSTERED ([SnapshotCommentId])
);
GO

-- notify.Notification: Workflow/deadline notification queue and delivery history.
CREATE TABLE [notify].[Notification] (
    [NotificationId] bigint IDENTITY(1,1) NOT NULL,
    [RecipientUserId] bigint NOT NULL,
    [NotificationType] varchar(50) NOT NULL,
    [RelatedRecordType] varchar(50) NULL,
    [RelatedRecordId] bigint NULL,
    [SubjectText] nvarchar(250) NOT NULL,
    [BodyText] nvarchar(max) NOT NULL,
    [ChannelCode] varchar(20) NOT NULL CONSTRAINT [DF_notify_Notification_ChannelCode] DEFAULT ('EMAIL'),
    [DeliveryStatus] varchar(20) NOT NULL CONSTRAINT [DF_notify_Notification_DeliveryStatus] DEFAULT ('Pending'),
    [QueuedAtUtc] datetime2(0) NOT NULL CONSTRAINT [DF_notify_Notification_QueuedAtUtc] DEFAULT (SYSUTCDATETIME()),
    [SentAtUtc] datetime2(0) NULL,
    [FailureMessage] nvarchar(2000) NULL,
    CONSTRAINT [PK_notify_Notification] PRIMARY KEY CLUSTERED ([NotificationId])
);
GO

-- audit.AuditLog: Append-only application audit log for data and workflow actions.
CREATE TABLE [audit].[AuditLog] (
    [AuditLogId] bigint IDENTITY(1,1) NOT NULL,
    [EventAtUtc] datetime2(0) NOT NULL CONSTRAINT [DF_audit_AuditLog_EventAtUtc] DEFAULT (SYSUTCDATETIME()),
    [AppUserId] bigint NULL,
    [SecurityRoleId] int NULL,
    [ActionCode] varchar(50) NOT NULL,
    [ModuleCode] varchar(50) NOT NULL,
    [RecordType] varchar(50) NULL,
    [RecordId] nvarchar(100) NULL,
    [OldValueJson] nvarchar(max) NULL,
    [NewValueJson] nvarchar(max) NULL,
    [ReasonText] nvarchar(2000) NULL,
    [CorrelationId] uniqueidentifier NOT NULL CONSTRAINT [DF_audit_AuditLog_CorrelationId] DEFAULT (NEWID()),
    [SourceIpAddress] varchar(45) NULL,
    [Succeeded] bit NOT NULL CONSTRAINT [DF_audit_AuditLog_Succeeded] DEFAULT (1),
    CONSTRAINT [PK_audit_AuditLog] PRIMARY KEY CLUSTERED ([AuditLogId])
);
GO

-- cfg.Configuration: Effective-dated application/business rule configuration.
CREATE TABLE [cfg].[Configuration] (
    [ConfigurationId] bigint IDENTITY(1,1) NOT NULL,
    [ConfigGroup] varchar(50) NOT NULL,
    [ConfigKey] varchar(100) NOT NULL,
    [ConfigValue] nvarchar(2000) NOT NULL,
    [DataTypeCode] varchar(20) NOT NULL CONSTRAINT [DF_cfg_Configuration_DataTypeCode] DEFAULT ('STRING'),
    [EffectiveFrom] date NOT NULL,
    [EffectiveTo] date NULL,
    [IsActive] bit NOT NULL CONSTRAINT [DF_cfg_Configuration_IsActive] DEFAULT (1),
    [CreatedAtUtc] datetime2(0) NOT NULL CONSTRAINT [DF_cfg_Configuration_CreatedAtUtc] DEFAULT (SYSUTCDATETIME()),
    [CreatedByUserId] bigint NULL,
    [ModifiedAtUtc] datetime2(0) NULL,
    [ModifiedByUserId] bigint NULL,
    [RowVersion] rowversion,
    CONSTRAINT [PK_cfg_Configuration] PRIMARY KEY CLUSTERED ([ConfigurationId])
);
GO

-- banking.BankTransaction: Normalized bank statement transaction detail for future bank-specific parsing.
CREATE TABLE [banking].[BankTransaction] (
    [BankTransactionId] bigint IDENTITY(1,1) NOT NULL,
    [BankAccountId] bigint NOT NULL,
    [TransactionDate] date NULL,
    [ValueDate] date NULL,
    [TransactionType] nvarchar(100) NULL,
    [ReferenceText] nvarchar(250) NULL,
    [Description] nvarchar(1000) NULL,
    [DebitAmount] decimal(19,4) NOT NULL CONSTRAINT [DF_banking_BankTransaction_DebitAmount] DEFAULT (0),
    [CreditAmount] decimal(19,4) NOT NULL CONSTRAINT [DF_banking_BankTransaction_CreditAmount] DEFAULT (0),
    [RunningBalance] decimal(19,4) NULL,
    [CurrencyId] smallint NOT NULL,
    [SourceAttributesJson] nvarchar(max) NULL,
    [UploadBatchId] bigint NULL,
    [CreatedAtUtc] datetime2(0) NOT NULL CONSTRAINT [DF_banking_BankTransaction_CreatedAtUtc] DEFAULT (SYSUTCDATETIME()),
    [CreatedByUserId] bigint NULL,
    [ModifiedAtUtc] datetime2(0) NULL,
    [ModifiedByUserId] bigint NULL,
    [RowVersion] rowversion,
    CONSTRAINT [PK_banking_BankTransaction] PRIMARY KEY CLUSTERED ([BankTransactionId])
);
GO

ALTER TABLE [sec].[UserRole] WITH CHECK ADD CONSTRAINT [FK_sec_UserRole_AppUserId_sec_AppUser] FOREIGN KEY ([AppUserId]) REFERENCES [sec].[AppUser] ([AppUserId]);
ALTER TABLE [sec].[UserRole] CHECK CONSTRAINT [FK_sec_UserRole_AppUserId_sec_AppUser];
GO
ALTER TABLE [sec].[UserRole] WITH CHECK ADD CONSTRAINT [FK_sec_UserRole_SecurityRoleId_sec_SecurityRole] FOREIGN KEY ([SecurityRoleId]) REFERENCES [sec].[SecurityRole] ([SecurityRoleId]);
ALTER TABLE [sec].[UserRole] CHECK CONSTRAINT [FK_sec_UserRole_SecurityRoleId_sec_SecurityRole];
GO
ALTER TABLE [sec].[RolePermission] WITH CHECK ADD CONSTRAINT [FK_sec_RolePermission_SecurityRoleId_sec_SecurityRole] FOREIGN KEY ([SecurityRoleId]) REFERENCES [sec].[SecurityRole] ([SecurityRoleId]);
ALTER TABLE [sec].[RolePermission] CHECK CONSTRAINT [FK_sec_RolePermission_SecurityRoleId_sec_SecurityRole];
GO
ALTER TABLE [sec].[RolePermission] WITH CHECK ADD CONSTRAINT [FK_sec_RolePermission_PermissionId_sec_Permission] FOREIGN KEY ([PermissionId]) REFERENCES [sec].[Permission] ([PermissionId]);
ALTER TABLE [sec].[RolePermission] CHECK CONSTRAINT [FK_sec_RolePermission_PermissionId_sec_Permission];
GO
ALTER TABLE [ref].[Bank] WITH CHECK ADD CONSTRAINT [FK_ref_Bank_CountryId_ref_Country] FOREIGN KEY ([CountryId]) REFERENCES [ref].[Country] ([CountryId]);
ALTER TABLE [ref].[Bank] CHECK CONSTRAINT [FK_ref_Bank_CountryId_ref_Country];
GO
ALTER TABLE [org].[BusinessGroup] WITH CHECK ADD CONSTRAINT [FK_org_BusinessGroup_OrganizationId_org_Organization] FOREIGN KEY ([OrganizationId]) REFERENCES [org].[Organization] ([OrganizationId]);
ALTER TABLE [org].[BusinessGroup] CHECK CONSTRAINT [FK_org_BusinessGroup_OrganizationId_org_Organization];
GO
ALTER TABLE [org].[BusinessUnit] WITH CHECK ADD CONSTRAINT [FK_org_BusinessUnit_BusinessGroupId_org_BusinessGroup] FOREIGN KEY ([BusinessGroupId]) REFERENCES [org].[BusinessGroup] ([BusinessGroupId]);
ALTER TABLE [org].[BusinessUnit] CHECK CONSTRAINT [FK_org_BusinessUnit_BusinessGroupId_org_BusinessGroup];
GO
ALTER TABLE [org].[BusinessUnit] WITH CHECK ADD CONSTRAINT [FK_org_BusinessUnit_CountryId_ref_Country] FOREIGN KEY ([CountryId]) REFERENCES [ref].[Country] ([CountryId]);
ALTER TABLE [org].[BusinessUnit] CHECK CONSTRAINT [FK_org_BusinessUnit_CountryId_ref_Country];
GO
ALTER TABLE [org].[LegalEntity] WITH CHECK ADD CONSTRAINT [FK_org_LegalEntity_BusinessUnitId_org_BusinessUnit] FOREIGN KEY ([BusinessUnitId]) REFERENCES [org].[BusinessUnit] ([BusinessUnitId]);
ALTER TABLE [org].[LegalEntity] CHECK CONSTRAINT [FK_org_LegalEntity_BusinessUnitId_org_BusinessUnit];
GO
ALTER TABLE [org].[LegalEntity] WITH CHECK ADD CONSTRAINT [FK_org_LegalEntity_CountryId_ref_Country] FOREIGN KEY ([CountryId]) REFERENCES [ref].[Country] ([CountryId]);
ALTER TABLE [org].[LegalEntity] CHECK CONSTRAINT [FK_org_LegalEntity_CountryId_ref_Country];
GO
ALTER TABLE [sec].[UserBusinessUnit] WITH CHECK ADD CONSTRAINT [FK_sec_UserBusinessUnit_AppUserId_sec_AppUser] FOREIGN KEY ([AppUserId]) REFERENCES [sec].[AppUser] ([AppUserId]);
ALTER TABLE [sec].[UserBusinessUnit] CHECK CONSTRAINT [FK_sec_UserBusinessUnit_AppUserId_sec_AppUser];
GO
ALTER TABLE [sec].[UserBusinessUnit] WITH CHECK ADD CONSTRAINT [FK_sec_UserBusinessUnit_BusinessUnitId_org_BusinessUnit] FOREIGN KEY ([BusinessUnitId]) REFERENCES [org].[BusinessUnit] ([BusinessUnitId]);
ALTER TABLE [sec].[UserBusinessUnit] CHECK CONSTRAINT [FK_sec_UserBusinessUnit_BusinessUnitId_org_BusinessUnit];
GO
ALTER TABLE [rpt].[ReportVersion] WITH CHECK ADD CONSTRAINT [FK_rpt_ReportVersion_ReportingPeriodId_rpt_ReportingPeriod] FOREIGN KEY ([ReportingPeriodId]) REFERENCES [rpt].[ReportingPeriod] ([ReportingPeriodId]);
ALTER TABLE [rpt].[ReportVersion] CHECK CONSTRAINT [FK_rpt_ReportVersion_ReportingPeriodId_rpt_ReportingPeriod];
GO
ALTER TABLE [rpt].[ReportVersion] WITH CHECK ADD CONSTRAINT [FK_rpt_ReportVersion_ReopenedFromVersionId_rpt_ReportVersion] FOREIGN KEY ([ReopenedFromVersionId]) REFERENCES [rpt].[ReportVersion] ([ReportVersionId]);
ALTER TABLE [rpt].[ReportVersion] CHECK CONSTRAINT [FK_rpt_ReportVersion_ReopenedFromVersionId_rpt_ReportVersion];
GO
ALTER TABLE [rpt].[ReportVersion] WITH CHECK ADD CONSTRAINT [FK_rpt_ReportVersion_ApprovedByUserId_sec_AppUser] FOREIGN KEY ([ApprovedByUserId]) REFERENCES [sec].[AppUser] ([AppUserId]);
ALTER TABLE [rpt].[ReportVersion] CHECK CONSTRAINT [FK_rpt_ReportVersion_ApprovedByUserId_sec_AppUser];
GO
ALTER TABLE [rpt].[TreasurySubmission] WITH CHECK ADD CONSTRAINT [FK_rpt_TreasurySubmission_ReportingPeriodId_rpt_ReportingPeriod] FOREIGN KEY ([ReportingPeriodId]) REFERENCES [rpt].[ReportingPeriod] ([ReportingPeriodId]);
ALTER TABLE [rpt].[TreasurySubmission] CHECK CONSTRAINT [FK_rpt_TreasurySubmission_ReportingPeriodId_rpt_ReportingPeriod];
GO
ALTER TABLE [rpt].[TreasurySubmission] WITH CHECK ADD CONSTRAINT [FK_rpt_TreasurySubmission_ReportVersionId_rpt_ReportVersion] FOREIGN KEY ([ReportVersionId]) REFERENCES [rpt].[ReportVersion] ([ReportVersionId]);
ALTER TABLE [rpt].[TreasurySubmission] CHECK CONSTRAINT [FK_rpt_TreasurySubmission_ReportVersionId_rpt_ReportVersion];
GO
ALTER TABLE [rpt].[TreasurySubmission] WITH CHECK ADD CONSTRAINT [FK_rpt_TreasurySubmission_BusinessUnitId_org_BusinessUnit] FOREIGN KEY ([BusinessUnitId]) REFERENCES [org].[BusinessUnit] ([BusinessUnitId]);
ALTER TABLE [rpt].[TreasurySubmission] CHECK CONSTRAINT [FK_rpt_TreasurySubmission_BusinessUnitId_org_BusinessUnit];
GO
ALTER TABLE [rpt].[TreasurySubmission] WITH CHECK ADD CONSTRAINT [FK_rpt_TreasurySubmission_SubmittedByUserId_sec_AppUser] FOREIGN KEY ([SubmittedByUserId]) REFERENCES [sec].[AppUser] ([AppUserId]);
ALTER TABLE [rpt].[TreasurySubmission] CHECK CONSTRAINT [FK_rpt_TreasurySubmission_SubmittedByUserId_sec_AppUser];
GO
ALTER TABLE [banking].[BankAccount] WITH CHECK ADD CONSTRAINT [FK_banking_BankAccount_BusinessUnitId_org_BusinessUnit] FOREIGN KEY ([BusinessUnitId]) REFERENCES [org].[BusinessUnit] ([BusinessUnitId]);
ALTER TABLE [banking].[BankAccount] CHECK CONSTRAINT [FK_banking_BankAccount_BusinessUnitId_org_BusinessUnit];
GO
ALTER TABLE [banking].[BankAccount] WITH CHECK ADD CONSTRAINT [FK_banking_BankAccount_LegalEntityId_org_LegalEntity] FOREIGN KEY ([LegalEntityId]) REFERENCES [org].[LegalEntity] ([LegalEntityId]);
ALTER TABLE [banking].[BankAccount] CHECK CONSTRAINT [FK_banking_BankAccount_LegalEntityId_org_LegalEntity];
GO
ALTER TABLE [banking].[BankAccount] WITH CHECK ADD CONSTRAINT [FK_banking_BankAccount_BankId_ref_Bank] FOREIGN KEY ([BankId]) REFERENCES [ref].[Bank] ([BankId]);
ALTER TABLE [banking].[BankAccount] CHECK CONSTRAINT [FK_banking_BankAccount_BankId_ref_Bank];
GO
ALTER TABLE [banking].[BankAccount] WITH CHECK ADD CONSTRAINT [FK_banking_BankAccount_CurrencyId_ref_Currency] FOREIGN KEY ([CurrencyId]) REFERENCES [ref].[Currency] ([CurrencyId]);
ALTER TABLE [banking].[BankAccount] CHECK CONSTRAINT [FK_banking_BankAccount_CurrencyId_ref_Currency];
GO
ALTER TABLE [banking].[BankAccount] WITH CHECK ADD CONSTRAINT [FK_banking_BankAccount_AccountTypeId_ref_AccountType] FOREIGN KEY ([AccountTypeId]) REFERENCES [ref].[AccountType] ([AccountTypeId]);
ALTER TABLE [banking].[BankAccount] CHECK CONSTRAINT [FK_banking_BankAccount_AccountTypeId_ref_AccountType];
GO
ALTER TABLE [banking].[BankBalance] WITH CHECK ADD CONSTRAINT [FK_banking_BankBalance_BankAccountId_banking_BankAccount] FOREIGN KEY ([BankAccountId]) REFERENCES [banking].[BankAccount] ([BankAccountId]);
ALTER TABLE [banking].[BankBalance] CHECK CONSTRAINT [FK_banking_BankBalance_BankAccountId_banking_BankAccount];
GO
ALTER TABLE [banking].[BankBalance] WITH CHECK ADD CONSTRAINT [FK_banking_BankBalance_ReportingPeriodId_rpt_ReportingPeriod] FOREIGN KEY ([ReportingPeriodId]) REFERENCES [rpt].[ReportingPeriod] ([ReportingPeriodId]);
ALTER TABLE [banking].[BankBalance] CHECK CONSTRAINT [FK_banking_BankBalance_ReportingPeriodId_rpt_ReportingPeriod];
GO
ALTER TABLE [banking].[BankBalance] WITH CHECK ADD CONSTRAINT [FK_banking_BankBalance_ReportVersionId_rpt_ReportVersion] FOREIGN KEY ([ReportVersionId]) REFERENCES [rpt].[ReportVersion] ([ReportVersionId]);
ALTER TABLE [banking].[BankBalance] CHECK CONSTRAINT [FK_banking_BankBalance_ReportVersionId_rpt_ReportVersion];
GO
ALTER TABLE [banking].[BankBalance] WITH CHECK ADD CONSTRAINT [FK_banking_BankBalance_CurrencyId_ref_Currency] FOREIGN KEY ([CurrencyId]) REFERENCES [ref].[Currency] ([CurrencyId]);
ALTER TABLE [banking].[BankBalance] CHECK CONSTRAINT [FK_banking_BankBalance_CurrencyId_ref_Currency];
GO
ALTER TABLE [treasury].[FXRate] WITH CHECK ADD CONSTRAINT [FK_treasury_FXRate_FromCurrencyId_ref_Currency] FOREIGN KEY ([FromCurrencyId]) REFERENCES [ref].[Currency] ([CurrencyId]);
ALTER TABLE [treasury].[FXRate] CHECK CONSTRAINT [FK_treasury_FXRate_FromCurrencyId_ref_Currency];
GO
ALTER TABLE [treasury].[FXRate] WITH CHECK ADD CONSTRAINT [FK_treasury_FXRate_ToCurrencyId_ref_Currency] FOREIGN KEY ([ToCurrencyId]) REFERENCES [ref].[Currency] ([CurrencyId]);
ALTER TABLE [treasury].[FXRate] CHECK CONSTRAINT [FK_treasury_FXRate_ToCurrencyId_ref_Currency];
GO
ALTER TABLE [treasury].[FXRate] WITH CHECK ADD CONSTRAINT [FK_treasury_FXRate_ApprovedByUserId_sec_AppUser] FOREIGN KEY ([ApprovedByUserId]) REFERENCES [sec].[AppUser] ([AppUserId]);
ALTER TABLE [treasury].[FXRate] CHECK CONSTRAINT [FK_treasury_FXRate_ApprovedByUserId_sec_AppUser];
GO
ALTER TABLE [treasury].[WorkingCapitalFacility] WITH CHECK ADD CONSTRAINT [FK_treasury_WorkingCapitalFacility_BusinessUnitId_org_BusinessUnit] FOREIGN KEY ([BusinessUnitId]) REFERENCES [org].[BusinessUnit] ([BusinessUnitId]);
ALTER TABLE [treasury].[WorkingCapitalFacility] CHECK CONSTRAINT [FK_treasury_WorkingCapitalFacility_BusinessUnitId_org_BusinessUnit];
GO
ALTER TABLE [treasury].[WorkingCapitalFacility] WITH CHECK ADD CONSTRAINT [FK_treasury_WorkingCapitalFacility_LegalEntityId_org_LegalEntity] FOREIGN KEY ([LegalEntityId]) REFERENCES [org].[LegalEntity] ([LegalEntityId]);
ALTER TABLE [treasury].[WorkingCapitalFacility] CHECK CONSTRAINT [FK_treasury_WorkingCapitalFacility_LegalEntityId_org_LegalEntity];
GO
ALTER TABLE [treasury].[WorkingCapitalFacility] WITH CHECK ADD CONSTRAINT [FK_treasury_WorkingCapitalFacility_BankId_ref_Bank] FOREIGN KEY ([BankId]) REFERENCES [ref].[Bank] ([BankId]);
ALTER TABLE [treasury].[WorkingCapitalFacility] CHECK CONSTRAINT [FK_treasury_WorkingCapitalFacility_BankId_ref_Bank];
GO
ALTER TABLE [treasury].[WorkingCapitalFacility] WITH CHECK ADD CONSTRAINT [FK_treasury_WorkingCapitalFacility_ParentFacilityId_treasury_WorkingCapitalFacility] FOREIGN KEY ([ParentFacilityId]) REFERENCES [treasury].[WorkingCapitalFacility] ([FacilityId]);
ALTER TABLE [treasury].[WorkingCapitalFacility] CHECK CONSTRAINT [FK_treasury_WorkingCapitalFacility_ParentFacilityId_treasury_WorkingCapitalFacility];
GO
ALTER TABLE [treasury].[WorkingCapitalFacility] WITH CHECK ADD CONSTRAINT [FK_treasury_WorkingCapitalFacility_FacilityTypeId_ref_FacilityType] FOREIGN KEY ([FacilityTypeId]) REFERENCES [ref].[FacilityType] ([FacilityTypeId]);
ALTER TABLE [treasury].[WorkingCapitalFacility] CHECK CONSTRAINT [FK_treasury_WorkingCapitalFacility_FacilityTypeId_ref_FacilityType];
GO
ALTER TABLE [treasury].[WorkingCapitalFacility] WITH CHECK ADD CONSTRAINT [FK_treasury_WorkingCapitalFacility_CurrencyId_ref_Currency] FOREIGN KEY ([CurrencyId]) REFERENCES [ref].[Currency] ([CurrencyId]);
ALTER TABLE [treasury].[WorkingCapitalFacility] CHECK CONSTRAINT [FK_treasury_WorkingCapitalFacility_CurrencyId_ref_Currency];
GO
ALTER TABLE [treasury].[FacilityUtilization] WITH CHECK ADD CONSTRAINT [FK_treasury_FacilityUtilization_FacilityId_treasury_WorkingCapitalFacility] FOREIGN KEY ([FacilityId]) REFERENCES [treasury].[WorkingCapitalFacility] ([FacilityId]);
ALTER TABLE [treasury].[FacilityUtilization] CHECK CONSTRAINT [FK_treasury_FacilityUtilization_FacilityId_treasury_WorkingCapitalFacility];
GO
ALTER TABLE [treasury].[FacilityUtilization] WITH CHECK ADD CONSTRAINT [FK_treasury_FacilityUtilization_ReportingPeriodId_rpt_ReportingPeriod] FOREIGN KEY ([ReportingPeriodId]) REFERENCES [rpt].[ReportingPeriod] ([ReportingPeriodId]);
ALTER TABLE [treasury].[FacilityUtilization] CHECK CONSTRAINT [FK_treasury_FacilityUtilization_ReportingPeriodId_rpt_ReportingPeriod];
GO
ALTER TABLE [treasury].[FacilityUtilization] WITH CHECK ADD CONSTRAINT [FK_treasury_FacilityUtilization_ReportVersionId_rpt_ReportVersion] FOREIGN KEY ([ReportVersionId]) REFERENCES [rpt].[ReportVersion] ([ReportVersionId]);
ALTER TABLE [treasury].[FacilityUtilization] CHECK CONSTRAINT [FK_treasury_FacilityUtilization_ReportVersionId_rpt_ReportVersion];
GO
ALTER TABLE [treasury].[FacilityApplication] WITH CHECK ADD CONSTRAINT [FK_treasury_FacilityApplication_ReportingPeriodId_rpt_ReportingPeriod] FOREIGN KEY ([ReportingPeriodId]) REFERENCES [rpt].[ReportingPeriod] ([ReportingPeriodId]);
ALTER TABLE [treasury].[FacilityApplication] CHECK CONSTRAINT [FK_treasury_FacilityApplication_ReportingPeriodId_rpt_ReportingPeriod];
GO
ALTER TABLE [treasury].[FacilityApplication] WITH CHECK ADD CONSTRAINT [FK_treasury_FacilityApplication_ReportVersionId_rpt_ReportVersion] FOREIGN KEY ([ReportVersionId]) REFERENCES [rpt].[ReportVersion] ([ReportVersionId]);
ALTER TABLE [treasury].[FacilityApplication] CHECK CONSTRAINT [FK_treasury_FacilityApplication_ReportVersionId_rpt_ReportVersion];
GO
ALTER TABLE [treasury].[FacilityApplication] WITH CHECK ADD CONSTRAINT [FK_treasury_FacilityApplication_BusinessUnitId_org_BusinessUnit] FOREIGN KEY ([BusinessUnitId]) REFERENCES [org].[BusinessUnit] ([BusinessUnitId]);
ALTER TABLE [treasury].[FacilityApplication] CHECK CONSTRAINT [FK_treasury_FacilityApplication_BusinessUnitId_org_BusinessUnit];
GO
ALTER TABLE [treasury].[FacilityApplication] WITH CHECK ADD CONSTRAINT [FK_treasury_FacilityApplication_BankId_ref_Bank] FOREIGN KEY ([BankId]) REFERENCES [ref].[Bank] ([BankId]);
ALTER TABLE [treasury].[FacilityApplication] CHECK CONSTRAINT [FK_treasury_FacilityApplication_BankId_ref_Bank];
GO
ALTER TABLE [treasury].[FacilityApplication] WITH CHECK ADD CONSTRAINT [FK_treasury_FacilityApplication_FacilityTypeId_ref_FacilityType] FOREIGN KEY ([FacilityTypeId]) REFERENCES [ref].[FacilityType] ([FacilityTypeId]);
ALTER TABLE [treasury].[FacilityApplication] CHECK CONSTRAINT [FK_treasury_FacilityApplication_FacilityTypeId_ref_FacilityType];
GO
ALTER TABLE [treasury].[Loan] WITH CHECK ADD CONSTRAINT [FK_treasury_Loan_BusinessUnitId_org_BusinessUnit] FOREIGN KEY ([BusinessUnitId]) REFERENCES [org].[BusinessUnit] ([BusinessUnitId]);
ALTER TABLE [treasury].[Loan] CHECK CONSTRAINT [FK_treasury_Loan_BusinessUnitId_org_BusinessUnit];
GO
ALTER TABLE [treasury].[Loan] WITH CHECK ADD CONSTRAINT [FK_treasury_Loan_LegalEntityId_org_LegalEntity] FOREIGN KEY ([LegalEntityId]) REFERENCES [org].[LegalEntity] ([LegalEntityId]);
ALTER TABLE [treasury].[Loan] CHECK CONSTRAINT [FK_treasury_Loan_LegalEntityId_org_LegalEntity];
GO
ALTER TABLE [treasury].[Loan] WITH CHECK ADD CONSTRAINT [FK_treasury_Loan_BankId_ref_Bank] FOREIGN KEY ([BankId]) REFERENCES [ref].[Bank] ([BankId]);
ALTER TABLE [treasury].[Loan] CHECK CONSTRAINT [FK_treasury_Loan_BankId_ref_Bank];
GO
ALTER TABLE [treasury].[Loan] WITH CHECK ADD CONSTRAINT [FK_treasury_Loan_FacilityTypeId_ref_FacilityType] FOREIGN KEY ([FacilityTypeId]) REFERENCES [ref].[FacilityType] ([FacilityTypeId]);
ALTER TABLE [treasury].[Loan] CHECK CONSTRAINT [FK_treasury_Loan_FacilityTypeId_ref_FacilityType];
GO
ALTER TABLE [treasury].[Loan] WITH CHECK ADD CONSTRAINT [FK_treasury_Loan_CurrencyId_ref_Currency] FOREIGN KEY ([CurrencyId]) REFERENCES [ref].[Currency] ([CurrencyId]);
ALTER TABLE [treasury].[Loan] CHECK CONSTRAINT [FK_treasury_Loan_CurrencyId_ref_Currency];
GO
ALTER TABLE [treasury].[LoanRepayment] WITH CHECK ADD CONSTRAINT [FK_treasury_LoanRepayment_LoanId_treasury_Loan] FOREIGN KEY ([LoanId]) REFERENCES [treasury].[Loan] ([LoanId]);
ALTER TABLE [treasury].[LoanRepayment] CHECK CONSTRAINT [FK_treasury_LoanRepayment_LoanId_treasury_Loan];
GO
ALTER TABLE [treasury].[LoanRepayment] WITH CHECK ADD CONSTRAINT [FK_treasury_LoanRepayment_ReportingPeriodId_rpt_ReportingPeriod] FOREIGN KEY ([ReportingPeriodId]) REFERENCES [rpt].[ReportingPeriod] ([ReportingPeriodId]);
ALTER TABLE [treasury].[LoanRepayment] CHECK CONSTRAINT [FK_treasury_LoanRepayment_ReportingPeriodId_rpt_ReportingPeriod];
GO
ALTER TABLE [treasury].[LoanRepayment] WITH CHECK ADD CONSTRAINT [FK_treasury_LoanRepayment_ReportVersionId_rpt_ReportVersion] FOREIGN KEY ([ReportVersionId]) REFERENCES [rpt].[ReportVersion] ([ReportVersionId]);
ALTER TABLE [treasury].[LoanRepayment] CHECK CONSTRAINT [FK_treasury_LoanRepayment_ReportVersionId_rpt_ReportVersion];
GO
ALTER TABLE [treasury].[LoanMovementForecast] WITH CHECK ADD CONSTRAINT [FK_treasury_LoanMovementForecast_LoanId_treasury_Loan] FOREIGN KEY ([LoanId]) REFERENCES [treasury].[Loan] ([LoanId]);
ALTER TABLE [treasury].[LoanMovementForecast] CHECK CONSTRAINT [FK_treasury_LoanMovementForecast_LoanId_treasury_Loan];
GO
ALTER TABLE [treasury].[LoanMovementForecast] WITH CHECK ADD CONSTRAINT [FK_treasury_LoanMovementForecast_ReportingPeriodId_rpt_ReportingPeriod] FOREIGN KEY ([ReportingPeriodId]) REFERENCES [rpt].[ReportingPeriod] ([ReportingPeriodId]);
ALTER TABLE [treasury].[LoanMovementForecast] CHECK CONSTRAINT [FK_treasury_LoanMovementForecast_ReportingPeriodId_rpt_ReportingPeriod];
GO
ALTER TABLE [treasury].[LoanMovementForecast] WITH CHECK ADD CONSTRAINT [FK_treasury_LoanMovementForecast_ReportVersionId_rpt_ReportVersion] FOREIGN KEY ([ReportVersionId]) REFERENCES [rpt].[ReportVersion] ([ReportVersionId]);
ALTER TABLE [treasury].[LoanMovementForecast] CHECK CONSTRAINT [FK_treasury_LoanMovementForecast_ReportVersionId_rpt_ReportVersion];
GO
ALTER TABLE [treasury].[Investment] WITH CHECK ADD CONSTRAINT [FK_treasury_Investment_BusinessUnitId_org_BusinessUnit] FOREIGN KEY ([BusinessUnitId]) REFERENCES [org].[BusinessUnit] ([BusinessUnitId]);
ALTER TABLE [treasury].[Investment] CHECK CONSTRAINT [FK_treasury_Investment_BusinessUnitId_org_BusinessUnit];
GO
ALTER TABLE [treasury].[Investment] WITH CHECK ADD CONSTRAINT [FK_treasury_Investment_LegalEntityId_org_LegalEntity] FOREIGN KEY ([LegalEntityId]) REFERENCES [org].[LegalEntity] ([LegalEntityId]);
ALTER TABLE [treasury].[Investment] CHECK CONSTRAINT [FK_treasury_Investment_LegalEntityId_org_LegalEntity];
GO
ALTER TABLE [treasury].[Investment] WITH CHECK ADD CONSTRAINT [FK_treasury_Investment_InvestmentTypeId_ref_InvestmentType] FOREIGN KEY ([InvestmentTypeId]) REFERENCES [ref].[InvestmentType] ([InvestmentTypeId]);
ALTER TABLE [treasury].[Investment] CHECK CONSTRAINT [FK_treasury_Investment_InvestmentTypeId_ref_InvestmentType];
GO
ALTER TABLE [treasury].[Investment] WITH CHECK ADD CONSTRAINT [FK_treasury_Investment_CountryId_ref_Country] FOREIGN KEY ([CountryId]) REFERENCES [ref].[Country] ([CountryId]);
ALTER TABLE [treasury].[Investment] CHECK CONSTRAINT [FK_treasury_Investment_CountryId_ref_Country];
GO
ALTER TABLE [treasury].[Investment] WITH CHECK ADD CONSTRAINT [FK_treasury_Investment_CurrencyId_ref_Currency] FOREIGN KEY ([CurrencyId]) REFERENCES [ref].[Currency] ([CurrencyId]);
ALTER TABLE [treasury].[Investment] CHECK CONSTRAINT [FK_treasury_Investment_CurrencyId_ref_Currency];
GO
ALTER TABLE [treasury].[InvestmentValuation] WITH CHECK ADD CONSTRAINT [FK_treasury_InvestmentValuation_InvestmentId_treasury_Investment] FOREIGN KEY ([InvestmentId]) REFERENCES [treasury].[Investment] ([InvestmentId]);
ALTER TABLE [treasury].[InvestmentValuation] CHECK CONSTRAINT [FK_treasury_InvestmentValuation_InvestmentId_treasury_Investment];
GO
ALTER TABLE [treasury].[InvestmentValuation] WITH CHECK ADD CONSTRAINT [FK_treasury_InvestmentValuation_ReportingPeriodId_rpt_ReportingPeriod] FOREIGN KEY ([ReportingPeriodId]) REFERENCES [rpt].[ReportingPeriod] ([ReportingPeriodId]);
ALTER TABLE [treasury].[InvestmentValuation] CHECK CONSTRAINT [FK_treasury_InvestmentValuation_ReportingPeriodId_rpt_ReportingPeriod];
GO
ALTER TABLE [treasury].[InvestmentValuation] WITH CHECK ADD CONSTRAINT [FK_treasury_InvestmentValuation_ReportVersionId_rpt_ReportVersion] FOREIGN KEY ([ReportVersionId]) REFERENCES [rpt].[ReportVersion] ([ReportVersionId]);
ALTER TABLE [treasury].[InvestmentValuation] CHECK CONSTRAINT [FK_treasury_InvestmentValuation_ReportVersionId_rpt_ReportVersion];
GO
ALTER TABLE [treasury].[InvestmentValuation] WITH CHECK ADD CONSTRAINT [FK_treasury_InvestmentValuation_AppliedFXRateId_treasury_FXRate] FOREIGN KEY ([AppliedFXRateId]) REFERENCES [treasury].[FXRate] ([FXRateId]);
ALTER TABLE [treasury].[InvestmentValuation] CHECK CONSTRAINT [FK_treasury_InvestmentValuation_AppliedFXRateId_treasury_FXRate];
GO
ALTER TABLE [treasury].[EquityValuation] WITH CHECK ADD CONSTRAINT [FK_treasury_EquityValuation_ReportingPeriodId_rpt_ReportingPeriod] FOREIGN KEY ([ReportingPeriodId]) REFERENCES [rpt].[ReportingPeriod] ([ReportingPeriodId]);
ALTER TABLE [treasury].[EquityValuation] CHECK CONSTRAINT [FK_treasury_EquityValuation_ReportingPeriodId_rpt_ReportingPeriod];
GO
ALTER TABLE [treasury].[EquityValuation] WITH CHECK ADD CONSTRAINT [FK_treasury_EquityValuation_ReportVersionId_rpt_ReportVersion] FOREIGN KEY ([ReportVersionId]) REFERENCES [rpt].[ReportVersion] ([ReportVersionId]);
ALTER TABLE [treasury].[EquityValuation] CHECK CONSTRAINT [FK_treasury_EquityValuation_ReportVersionId_rpt_ReportVersion];
GO
ALTER TABLE [treasury].[EquityValuation] WITH CHECK ADD CONSTRAINT [FK_treasury_EquityValuation_BusinessUnitId_org_BusinessUnit] FOREIGN KEY ([BusinessUnitId]) REFERENCES [org].[BusinessUnit] ([BusinessUnitId]);
ALTER TABLE [treasury].[EquityValuation] CHECK CONSTRAINT [FK_treasury_EquityValuation_BusinessUnitId_org_BusinessUnit];
GO
ALTER TABLE [treasury].[CashFlowForecast] WITH CHECK ADD CONSTRAINT [FK_treasury_CashFlowForecast_ReportingPeriodId_rpt_ReportingPeriod] FOREIGN KEY ([ReportingPeriodId]) REFERENCES [rpt].[ReportingPeriod] ([ReportingPeriodId]);
ALTER TABLE [treasury].[CashFlowForecast] CHECK CONSTRAINT [FK_treasury_CashFlowForecast_ReportingPeriodId_rpt_ReportingPeriod];
GO
ALTER TABLE [treasury].[CashFlowForecast] WITH CHECK ADD CONSTRAINT [FK_treasury_CashFlowForecast_ReportVersionId_rpt_ReportVersion] FOREIGN KEY ([ReportVersionId]) REFERENCES [rpt].[ReportVersion] ([ReportVersionId]);
ALTER TABLE [treasury].[CashFlowForecast] CHECK CONSTRAINT [FK_treasury_CashFlowForecast_ReportVersionId_rpt_ReportVersion];
GO
ALTER TABLE [treasury].[CashFlowForecast] WITH CHECK ADD CONSTRAINT [FK_treasury_CashFlowForecast_BusinessUnitId_org_BusinessUnit] FOREIGN KEY ([BusinessUnitId]) REFERENCES [org].[BusinessUnit] ([BusinessUnitId]);
ALTER TABLE [treasury].[CashFlowForecast] CHECK CONSTRAINT [FK_treasury_CashFlowForecast_BusinessUnitId_org_BusinessUnit];
GO
ALTER TABLE [treasury].[CashFlowForecast] WITH CHECK ADD CONSTRAINT [FK_treasury_CashFlowForecast_CashFlowCategoryId_treasury_CashFlowCategory] FOREIGN KEY ([CashFlowCategoryId]) REFERENCES [treasury].[CashFlowCategory] ([CashFlowCategoryId]);
ALTER TABLE [treasury].[CashFlowForecast] CHECK CONSTRAINT [FK_treasury_CashFlowForecast_CashFlowCategoryId_treasury_CashFlowCategory];
GO
ALTER TABLE [treasury].[CashFlowForecast] WITH CHECK ADD CONSTRAINT [FK_treasury_CashFlowForecast_CurrencyId_ref_Currency] FOREIGN KEY ([CurrencyId]) REFERENCES [ref].[Currency] ([CurrencyId]);
ALTER TABLE [treasury].[CashFlowForecast] CHECK CONSTRAINT [FK_treasury_CashFlowForecast_CurrencyId_ref_Currency];
GO
ALTER TABLE [treasury].[LiquidityAdjustment] WITH CHECK ADD CONSTRAINT [FK_treasury_LiquidityAdjustment_ReportingPeriodId_rpt_ReportingPeriod] FOREIGN KEY ([ReportingPeriodId]) REFERENCES [rpt].[ReportingPeriod] ([ReportingPeriodId]);
ALTER TABLE [treasury].[LiquidityAdjustment] CHECK CONSTRAINT [FK_treasury_LiquidityAdjustment_ReportingPeriodId_rpt_ReportingPeriod];
GO
ALTER TABLE [treasury].[LiquidityAdjustment] WITH CHECK ADD CONSTRAINT [FK_treasury_LiquidityAdjustment_ReportVersionId_rpt_ReportVersion] FOREIGN KEY ([ReportVersionId]) REFERENCES [rpt].[ReportVersion] ([ReportVersionId]);
ALTER TABLE [treasury].[LiquidityAdjustment] CHECK CONSTRAINT [FK_treasury_LiquidityAdjustment_ReportVersionId_rpt_ReportVersion];
GO
ALTER TABLE [treasury].[LiquidityAdjustment] WITH CHECK ADD CONSTRAINT [FK_treasury_LiquidityAdjustment_BusinessUnitId_org_BusinessUnit] FOREIGN KEY ([BusinessUnitId]) REFERENCES [org].[BusinessUnit] ([BusinessUnitId]);
ALTER TABLE [treasury].[LiquidityAdjustment] CHECK CONSTRAINT [FK_treasury_LiquidityAdjustment_BusinessUnitId_org_BusinessUnit];
GO
ALTER TABLE [treasury].[LiquidityAdjustment] WITH CHECK ADD CONSTRAINT [FK_treasury_LiquidityAdjustment_CurrencyId_ref_Currency] FOREIGN KEY ([CurrencyId]) REFERENCES [ref].[Currency] ([CurrencyId]);
ALTER TABLE [treasury].[LiquidityAdjustment] CHECK CONSTRAINT [FK_treasury_LiquidityAdjustment_CurrencyId_ref_Currency];
GO
ALTER TABLE [treasury].[LiquidityAdjustment] WITH CHECK ADD CONSTRAINT [FK_treasury_LiquidityAdjustment_ApprovedByUserId_sec_AppUser] FOREIGN KEY ([ApprovedByUserId]) REFERENCES [sec].[AppUser] ([AppUserId]);
ALTER TABLE [treasury].[LiquidityAdjustment] CHECK CONSTRAINT [FK_treasury_LiquidityAdjustment_ApprovedByUserId_sec_AppUser];
GO
ALTER TABLE [workflow].[WorkflowInstance] WITH CHECK ADD CONSTRAINT [FK_workflow_WorkflowInstance_TreasurySubmissionId_rpt_TreasurySubmission] FOREIGN KEY ([TreasurySubmissionId]) REFERENCES [rpt].[TreasurySubmission] ([TreasurySubmissionId]);
ALTER TABLE [workflow].[WorkflowInstance] CHECK CONSTRAINT [FK_workflow_WorkflowInstance_TreasurySubmissionId_rpt_TreasurySubmission];
GO
ALTER TABLE [workflow].[WorkflowInstance] WITH CHECK ADD CONSTRAINT [FK_workflow_WorkflowInstance_ReportVersionId_rpt_ReportVersion] FOREIGN KEY ([ReportVersionId]) REFERENCES [rpt].[ReportVersion] ([ReportVersionId]);
ALTER TABLE [workflow].[WorkflowInstance] CHECK CONSTRAINT [FK_workflow_WorkflowInstance_ReportVersionId_rpt_ReportVersion];
GO
ALTER TABLE [workflow].[WorkflowAction] WITH CHECK ADD CONSTRAINT [FK_workflow_WorkflowAction_WorkflowInstanceId_workflow_WorkflowInstance] FOREIGN KEY ([WorkflowInstanceId]) REFERENCES [workflow].[WorkflowInstance] ([WorkflowInstanceId]);
ALTER TABLE [workflow].[WorkflowAction] CHECK CONSTRAINT [FK_workflow_WorkflowAction_WorkflowInstanceId_workflow_WorkflowInstance];
GO
ALTER TABLE [workflow].[WorkflowAction] WITH CHECK ADD CONSTRAINT [FK_workflow_WorkflowAction_AppUserId_sec_AppUser] FOREIGN KEY ([AppUserId]) REFERENCES [sec].[AppUser] ([AppUserId]);
ALTER TABLE [workflow].[WorkflowAction] CHECK CONSTRAINT [FK_workflow_WorkflowAction_AppUserId_sec_AppUser];
GO
ALTER TABLE [workflow].[WorkflowAction] WITH CHECK ADD CONSTRAINT [FK_workflow_WorkflowAction_SecurityRoleId_sec_SecurityRole] FOREIGN KEY ([SecurityRoleId]) REFERENCES [sec].[SecurityRole] ([SecurityRoleId]);
ALTER TABLE [workflow].[WorkflowAction] CHECK CONSTRAINT [FK_workflow_WorkflowAction_SecurityRoleId_sec_SecurityRole];
GO
ALTER TABLE [workflow].[WorkflowComment] WITH CHECK ADD CONSTRAINT [FK_workflow_WorkflowComment_ReportingPeriodId_rpt_ReportingPeriod] FOREIGN KEY ([ReportingPeriodId]) REFERENCES [rpt].[ReportingPeriod] ([ReportingPeriodId]);
ALTER TABLE [workflow].[WorkflowComment] CHECK CONSTRAINT [FK_workflow_WorkflowComment_ReportingPeriodId_rpt_ReportingPeriod];
GO
ALTER TABLE [workflow].[WorkflowComment] WITH CHECK ADD CONSTRAINT [FK_workflow_WorkflowComment_ReportVersionId_rpt_ReportVersion] FOREIGN KEY ([ReportVersionId]) REFERENCES [rpt].[ReportVersion] ([ReportVersionId]);
ALTER TABLE [workflow].[WorkflowComment] CHECK CONSTRAINT [FK_workflow_WorkflowComment_ReportVersionId_rpt_ReportVersion];
GO
ALTER TABLE [workflow].[WorkflowComment] WITH CHECK ADD CONSTRAINT [FK_workflow_WorkflowComment_BusinessUnitId_org_BusinessUnit] FOREIGN KEY ([BusinessUnitId]) REFERENCES [org].[BusinessUnit] ([BusinessUnitId]);
ALTER TABLE [workflow].[WorkflowComment] CHECK CONSTRAINT [FK_workflow_WorkflowComment_BusinessUnitId_org_BusinessUnit];
GO
ALTER TABLE [workflow].[WorkflowComment] WITH CHECK ADD CONSTRAINT [FK_workflow_WorkflowComment_ParentCommentId_workflow_WorkflowComment] FOREIGN KEY ([ParentCommentId]) REFERENCES [workflow].[WorkflowComment] ([WorkflowCommentId]);
ALTER TABLE [workflow].[WorkflowComment] CHECK CONSTRAINT [FK_workflow_WorkflowComment_ParentCommentId_workflow_WorkflowComment];
GO
ALTER TABLE [workflow].[WorkflowComment] WITH CHECK ADD CONSTRAINT [FK_workflow_WorkflowComment_CommentedByUserId_sec_AppUser] FOREIGN KEY ([CommentedByUserId]) REFERENCES [sec].[AppUser] ([AppUserId]);
ALTER TABLE [workflow].[WorkflowComment] CHECK CONSTRAINT [FK_workflow_WorkflowComment_CommentedByUserId_sec_AppUser];
GO
ALTER TABLE [workflow].[WorkflowComment] WITH CHECK ADD CONSTRAINT [FK_workflow_WorkflowComment_CommentedByRoleId_sec_SecurityRole] FOREIGN KEY ([CommentedByRoleId]) REFERENCES [sec].[SecurityRole] ([SecurityRoleId]);
ALTER TABLE [workflow].[WorkflowComment] CHECK CONSTRAINT [FK_workflow_WorkflowComment_CommentedByRoleId_sec_SecurityRole];
GO
ALTER TABLE [workflow].[TreasuryException] WITH CHECK ADD CONSTRAINT [FK_workflow_TreasuryException_ReportingPeriodId_rpt_ReportingPeriod] FOREIGN KEY ([ReportingPeriodId]) REFERENCES [rpt].[ReportingPeriod] ([ReportingPeriodId]);
ALTER TABLE [workflow].[TreasuryException] CHECK CONSTRAINT [FK_workflow_TreasuryException_ReportingPeriodId_rpt_ReportingPeriod];
GO
ALTER TABLE [workflow].[TreasuryException] WITH CHECK ADD CONSTRAINT [FK_workflow_TreasuryException_ReportVersionId_rpt_ReportVersion] FOREIGN KEY ([ReportVersionId]) REFERENCES [rpt].[ReportVersion] ([ReportVersionId]);
ALTER TABLE [workflow].[TreasuryException] CHECK CONSTRAINT [FK_workflow_TreasuryException_ReportVersionId_rpt_ReportVersion];
GO
ALTER TABLE [workflow].[TreasuryException] WITH CHECK ADD CONSTRAINT [FK_workflow_TreasuryException_BusinessUnitId_org_BusinessUnit] FOREIGN KEY ([BusinessUnitId]) REFERENCES [org].[BusinessUnit] ([BusinessUnitId]);
ALTER TABLE [workflow].[TreasuryException] CHECK CONSTRAINT [FK_workflow_TreasuryException_BusinessUnitId_org_BusinessUnit];
GO
ALTER TABLE [workflow].[TreasuryException] WITH CHECK ADD CONSTRAINT [FK_workflow_TreasuryException_OwnerUserId_sec_AppUser] FOREIGN KEY ([OwnerUserId]) REFERENCES [sec].[AppUser] ([AppUserId]);
ALTER TABLE [workflow].[TreasuryException] CHECK CONSTRAINT [FK_workflow_TreasuryException_OwnerUserId_sec_AppUser];
GO
ALTER TABLE [workflow].[TreasuryException] WITH CHECK ADD CONSTRAINT [FK_workflow_TreasuryException_OverrideByUserId_sec_AppUser] FOREIGN KEY ([OverrideByUserId]) REFERENCES [sec].[AppUser] ([AppUserId]);
ALTER TABLE [workflow].[TreasuryException] CHECK CONSTRAINT [FK_workflow_TreasuryException_OverrideByUserId_sec_AppUser];
GO
ALTER TABLE [ingest].[UploadTemplateColumn] WITH CHECK ADD CONSTRAINT [FK_ingest_UploadTemplateColumn_UploadTemplateId_ingest_UploadTemplate] FOREIGN KEY ([UploadTemplateId]) REFERENCES [ingest].[UploadTemplate] ([UploadTemplateId]);
ALTER TABLE [ingest].[UploadTemplateColumn] CHECK CONSTRAINT [FK_ingest_UploadTemplateColumn_UploadTemplateId_ingest_UploadTemplate];
GO
ALTER TABLE [ingest].[UploadBatch] WITH CHECK ADD CONSTRAINT [FK_ingest_UploadBatch_ReportingPeriodId_rpt_ReportingPeriod] FOREIGN KEY ([ReportingPeriodId]) REFERENCES [rpt].[ReportingPeriod] ([ReportingPeriodId]);
ALTER TABLE [ingest].[UploadBatch] CHECK CONSTRAINT [FK_ingest_UploadBatch_ReportingPeriodId_rpt_ReportingPeriod];
GO
ALTER TABLE [ingest].[UploadBatch] WITH CHECK ADD CONSTRAINT [FK_ingest_UploadBatch_ReportVersionId_rpt_ReportVersion] FOREIGN KEY ([ReportVersionId]) REFERENCES [rpt].[ReportVersion] ([ReportVersionId]);
ALTER TABLE [ingest].[UploadBatch] CHECK CONSTRAINT [FK_ingest_UploadBatch_ReportVersionId_rpt_ReportVersion];
GO
ALTER TABLE [ingest].[UploadBatch] WITH CHECK ADD CONSTRAINT [FK_ingest_UploadBatch_BusinessUnitId_org_BusinessUnit] FOREIGN KEY ([BusinessUnitId]) REFERENCES [org].[BusinessUnit] ([BusinessUnitId]);
ALTER TABLE [ingest].[UploadBatch] CHECK CONSTRAINT [FK_ingest_UploadBatch_BusinessUnitId_org_BusinessUnit];
GO
ALTER TABLE [ingest].[UploadBatch] WITH CHECK ADD CONSTRAINT [FK_ingest_UploadBatch_UploadTemplateId_ingest_UploadTemplate] FOREIGN KEY ([UploadTemplateId]) REFERENCES [ingest].[UploadTemplate] ([UploadTemplateId]);
ALTER TABLE [ingest].[UploadBatch] CHECK CONSTRAINT [FK_ingest_UploadBatch_UploadTemplateId_ingest_UploadTemplate];
GO
ALTER TABLE [ingest].[UploadBatch] WITH CHECK ADD CONSTRAINT [FK_ingest_UploadBatch_UploadedByUserId_sec_AppUser] FOREIGN KEY ([UploadedByUserId]) REFERENCES [sec].[AppUser] ([AppUserId]);
ALTER TABLE [ingest].[UploadBatch] CHECK CONSTRAINT [FK_ingest_UploadBatch_UploadedByUserId_sec_AppUser];
GO
ALTER TABLE [ingest].[UploadDetail] WITH CHECK ADD CONSTRAINT [FK_ingest_UploadDetail_UploadBatchId_ingest_UploadBatch] FOREIGN KEY ([UploadBatchId]) REFERENCES [ingest].[UploadBatch] ([UploadBatchId]);
ALTER TABLE [ingest].[UploadDetail] CHECK CONSTRAINT [FK_ingest_UploadDetail_UploadBatchId_ingest_UploadBatch];
GO
ALTER TABLE [ingest].[ValidationError] WITH CHECK ADD CONSTRAINT [FK_ingest_ValidationError_UploadBatchId_ingest_UploadBatch] FOREIGN KEY ([UploadBatchId]) REFERENCES [ingest].[UploadBatch] ([UploadBatchId]);
ALTER TABLE [ingest].[ValidationError] CHECK CONSTRAINT [FK_ingest_ValidationError_UploadBatchId_ingest_UploadBatch];
GO
ALTER TABLE [ingest].[ValidationError] WITH CHECK ADD CONSTRAINT [FK_ingest_ValidationError_UploadDetailId_ingest_UploadDetail] FOREIGN KEY ([UploadDetailId]) REFERENCES [ingest].[UploadDetail] ([UploadDetailId]);
ALTER TABLE [ingest].[ValidationError] CHECK CONSTRAINT [FK_ingest_ValidationError_UploadDetailId_ingest_UploadDetail];
GO
ALTER TABLE [ingest].[ValidationError] WITH CHECK ADD CONSTRAINT [FK_ingest_ValidationError_ReportingPeriodId_rpt_ReportingPeriod] FOREIGN KEY ([ReportingPeriodId]) REFERENCES [rpt].[ReportingPeriod] ([ReportingPeriodId]);
ALTER TABLE [ingest].[ValidationError] CHECK CONSTRAINT [FK_ingest_ValidationError_ReportingPeriodId_rpt_ReportingPeriod];
GO
ALTER TABLE [ingest].[ValidationError] WITH CHECK ADD CONSTRAINT [FK_ingest_ValidationError_ReportVersionId_rpt_ReportVersion] FOREIGN KEY ([ReportVersionId]) REFERENCES [rpt].[ReportVersion] ([ReportVersionId]);
ALTER TABLE [ingest].[ValidationError] CHECK CONSTRAINT [FK_ingest_ValidationError_ReportVersionId_rpt_ReportVersion];
GO
ALTER TABLE [ingest].[Attachment] WITH CHECK ADD CONSTRAINT [FK_ingest_Attachment_ReportingPeriodId_rpt_ReportingPeriod] FOREIGN KEY ([ReportingPeriodId]) REFERENCES [rpt].[ReportingPeriod] ([ReportingPeriodId]);
ALTER TABLE [ingest].[Attachment] CHECK CONSTRAINT [FK_ingest_Attachment_ReportingPeriodId_rpt_ReportingPeriod];
GO
ALTER TABLE [ingest].[Attachment] WITH CHECK ADD CONSTRAINT [FK_ingest_Attachment_ReportVersionId_rpt_ReportVersion] FOREIGN KEY ([ReportVersionId]) REFERENCES [rpt].[ReportVersion] ([ReportVersionId]);
ALTER TABLE [ingest].[Attachment] CHECK CONSTRAINT [FK_ingest_Attachment_ReportVersionId_rpt_ReportVersion];
GO
ALTER TABLE [ingest].[Attachment] WITH CHECK ADD CONSTRAINT [FK_ingest_Attachment_BusinessUnitId_org_BusinessUnit] FOREIGN KEY ([BusinessUnitId]) REFERENCES [org].[BusinessUnit] ([BusinessUnitId]);
ALTER TABLE [ingest].[Attachment] CHECK CONSTRAINT [FK_ingest_Attachment_BusinessUnitId_org_BusinessUnit];
GO
ALTER TABLE [ingest].[Attachment] WITH CHECK ADD CONSTRAINT [FK_ingest_Attachment_UploadedByUserId_sec_AppUser] FOREIGN KEY ([UploadedByUserId]) REFERENCES [sec].[AppUser] ([AppUserId]);
ALTER TABLE [ingest].[Attachment] CHECK CONSTRAINT [FK_ingest_Attachment_UploadedByUserId_sec_AppUser];
GO
ALTER TABLE [banking].[BankBalance] WITH CHECK ADD CONSTRAINT [FK_banking_BankBalance_AppliedFXRateId_treasury_FXRate] FOREIGN KEY ([AppliedFXRateId]) REFERENCES [treasury].[FXRate] ([FXRateId]);
ALTER TABLE [banking].[BankBalance] CHECK CONSTRAINT [FK_banking_BankBalance_AppliedFXRateId_treasury_FXRate];
GO
ALTER TABLE [banking].[BankBalance] WITH CHECK ADD CONSTRAINT [FK_banking_BankBalance_UploadBatchId_ingest_UploadBatch] FOREIGN KEY ([UploadBatchId]) REFERENCES [ingest].[UploadBatch] ([UploadBatchId]);
ALTER TABLE [banking].[BankBalance] CHECK CONSTRAINT [FK_banking_BankBalance_UploadBatchId_ingest_UploadBatch];
GO
ALTER TABLE [treasury].[FacilityUtilization] WITH CHECK ADD CONSTRAINT [FK_treasury_FacilityUtilization_UploadBatchId_ingest_UploadBatch] FOREIGN KEY ([UploadBatchId]) REFERENCES [ingest].[UploadBatch] ([UploadBatchId]);
ALTER TABLE [treasury].[FacilityUtilization] CHECK CONSTRAINT [FK_treasury_FacilityUtilization_UploadBatchId_ingest_UploadBatch];
GO
ALTER TABLE [treasury].[CashFlowForecast] WITH CHECK ADD CONSTRAINT [FK_treasury_CashFlowForecast_UploadBatchId_ingest_UploadBatch] FOREIGN KEY ([UploadBatchId]) REFERENCES [ingest].[UploadBatch] ([UploadBatchId]);
ALTER TABLE [treasury].[CashFlowForecast] CHECK CONSTRAINT [FK_treasury_CashFlowForecast_UploadBatchId_ingest_UploadBatch];
GO
ALTER TABLE [rpt].[TreasurySnapshot] WITH CHECK ADD CONSTRAINT [FK_rpt_TreasurySnapshot_ReportingPeriodId_rpt_ReportingPeriod] FOREIGN KEY ([ReportingPeriodId]) REFERENCES [rpt].[ReportingPeriod] ([ReportingPeriodId]);
ALTER TABLE [rpt].[TreasurySnapshot] CHECK CONSTRAINT [FK_rpt_TreasurySnapshot_ReportingPeriodId_rpt_ReportingPeriod];
GO
ALTER TABLE [rpt].[TreasurySnapshot] WITH CHECK ADD CONSTRAINT [FK_rpt_TreasurySnapshot_ReportVersionId_rpt_ReportVersion] FOREIGN KEY ([ReportVersionId]) REFERENCES [rpt].[ReportVersion] ([ReportVersionId]);
ALTER TABLE [rpt].[TreasurySnapshot] CHECK CONSTRAINT [FK_rpt_TreasurySnapshot_ReportVersionId_rpt_ReportVersion];
GO
ALTER TABLE [rpt].[TreasurySnapshot] WITH CHECK ADD CONSTRAINT [FK_rpt_TreasurySnapshot_ApprovedByUserId_sec_AppUser] FOREIGN KEY ([ApprovedByUserId]) REFERENCES [sec].[AppUser] ([AppUserId]);
ALTER TABLE [rpt].[TreasurySnapshot] CHECK CONSTRAINT [FK_rpt_TreasurySnapshot_ApprovedByUserId_sec_AppUser];
GO
ALTER TABLE [rpt].[TreasurySnapshot] WITH CHECK ADD CONSTRAINT [FK_rpt_TreasurySnapshot_PublishedByUserId_sec_AppUser] FOREIGN KEY ([PublishedByUserId]) REFERENCES [sec].[AppUser] ([AppUserId]);
ALTER TABLE [rpt].[TreasurySnapshot] CHECK CONSTRAINT [FK_rpt_TreasurySnapshot_PublishedByUserId_sec_AppUser];
GO
ALTER TABLE [rpt].[SnapshotKPI] WITH CHECK ADD CONSTRAINT [FK_rpt_SnapshotKPI_TreasurySnapshotId_rpt_TreasurySnapshot] FOREIGN KEY ([TreasurySnapshotId]) REFERENCES [rpt].[TreasurySnapshot] ([TreasurySnapshotId]);
ALTER TABLE [rpt].[SnapshotKPI] CHECK CONSTRAINT [FK_rpt_SnapshotKPI_TreasurySnapshotId_rpt_TreasurySnapshot];
GO
ALTER TABLE [rpt].[SnapshotDetail] WITH CHECK ADD CONSTRAINT [FK_rpt_SnapshotDetail_TreasurySnapshotId_rpt_TreasurySnapshot] FOREIGN KEY ([TreasurySnapshotId]) REFERENCES [rpt].[TreasurySnapshot] ([TreasurySnapshotId]);
ALTER TABLE [rpt].[SnapshotDetail] CHECK CONSTRAINT [FK_rpt_SnapshotDetail_TreasurySnapshotId_rpt_TreasurySnapshot];
GO
ALTER TABLE [rpt].[SnapshotComment] WITH CHECK ADD CONSTRAINT [FK_rpt_SnapshotComment_TreasurySnapshotId_rpt_TreasurySnapshot] FOREIGN KEY ([TreasurySnapshotId]) REFERENCES [rpt].[TreasurySnapshot] ([TreasurySnapshotId]);
ALTER TABLE [rpt].[SnapshotComment] CHECK CONSTRAINT [FK_rpt_SnapshotComment_TreasurySnapshotId_rpt_TreasurySnapshot];
GO
ALTER TABLE [notify].[Notification] WITH CHECK ADD CONSTRAINT [FK_notify_Notification_RecipientUserId_sec_AppUser] FOREIGN KEY ([RecipientUserId]) REFERENCES [sec].[AppUser] ([AppUserId]);
ALTER TABLE [notify].[Notification] CHECK CONSTRAINT [FK_notify_Notification_RecipientUserId_sec_AppUser];
GO
ALTER TABLE [audit].[AuditLog] WITH CHECK ADD CONSTRAINT [FK_audit_AuditLog_AppUserId_sec_AppUser] FOREIGN KEY ([AppUserId]) REFERENCES [sec].[AppUser] ([AppUserId]);
ALTER TABLE [audit].[AuditLog] CHECK CONSTRAINT [FK_audit_AuditLog_AppUserId_sec_AppUser];
GO
ALTER TABLE [audit].[AuditLog] WITH CHECK ADD CONSTRAINT [FK_audit_AuditLog_SecurityRoleId_sec_SecurityRole] FOREIGN KEY ([SecurityRoleId]) REFERENCES [sec].[SecurityRole] ([SecurityRoleId]);
ALTER TABLE [audit].[AuditLog] CHECK CONSTRAINT [FK_audit_AuditLog_SecurityRoleId_sec_SecurityRole];
GO
ALTER TABLE [banking].[BankTransaction] WITH CHECK ADD CONSTRAINT [FK_banking_BankTransaction_BankAccountId_banking_BankAccount] FOREIGN KEY ([BankAccountId]) REFERENCES [banking].[BankAccount] ([BankAccountId]);
ALTER TABLE [banking].[BankTransaction] CHECK CONSTRAINT [FK_banking_BankTransaction_BankAccountId_banking_BankAccount];
GO
ALTER TABLE [banking].[BankTransaction] WITH CHECK ADD CONSTRAINT [FK_banking_BankTransaction_CurrencyId_ref_Currency] FOREIGN KEY ([CurrencyId]) REFERENCES [ref].[Currency] ([CurrencyId]);
ALTER TABLE [banking].[BankTransaction] CHECK CONSTRAINT [FK_banking_BankTransaction_CurrencyId_ref_Currency];
GO
ALTER TABLE [banking].[BankTransaction] WITH CHECK ADD CONSTRAINT [FK_banking_BankTransaction_UploadBatchId_ingest_UploadBatch] FOREIGN KEY ([UploadBatchId]) REFERENCES [ingest].[UploadBatch] ([UploadBatchId]);
ALTER TABLE [banking].[BankTransaction] CHECK CONSTRAINT [FK_banking_BankTransaction_UploadBatchId_ingest_UploadBatch];
GO

ALTER TABLE [banking].[BankAccount] WITH CHECK ADD CONSTRAINT [CK_BankAccount_Dates] CHECK (CloseDate IS NULL OR OpenDate IS NULL OR CloseDate >= OpenDate);
ALTER TABLE [banking].[BankAccount] CHECK CONSTRAINT [CK_BankAccount_Dates];
GO
ALTER TABLE [treasury].[FXRate] WITH CHECK ADD CONSTRAINT [CK_FXRate_Positive] CHECK (ExchangeRate > 0);
ALTER TABLE [treasury].[FXRate] CHECK CONSTRAINT [CK_FXRate_Positive];
GO
ALTER TABLE [treasury].[WorkingCapitalFacility] WITH CHECK ADD CONSTRAINT [CK_WCFacility_Limit] CHECK (SanctionedLimit >= 0);
ALTER TABLE [treasury].[WorkingCapitalFacility] CHECK CONSTRAINT [CK_WCFacility_Limit];
GO
ALTER TABLE [treasury].[WorkingCapitalFacility] WITH CHECK ADD CONSTRAINT [CK_WCFacility_Dates] CHECK (ExpiryDate IS NULL OR EffectiveDate IS NULL OR ExpiryDate >= EffectiveDate);
ALTER TABLE [treasury].[WorkingCapitalFacility] CHECK CONSTRAINT [CK_WCFacility_Dates];
GO
ALTER TABLE [treasury].[FacilityUtilization] WITH CHECK ADD CONSTRAINT [CK_FacilityUtilization_NonNegative] CHECK (UtilizedAmount >= 0 AND UnderProcessAmount >= 0);
ALTER TABLE [treasury].[FacilityUtilization] CHECK CONSTRAINT [CK_FacilityUtilization_NonNegative];
GO
ALTER TABLE [treasury].[Loan] WITH CHECK ADD CONSTRAINT [CK_Loan_Amounts] CHECK (OriginalLoanAmount >= 0 AND CurrentOutstanding >= 0);
ALTER TABLE [treasury].[Loan] CHECK CONSTRAINT [CK_Loan_Amounts];
GO
ALTER TABLE [treasury].[Loan] WITH CHECK ADD CONSTRAINT [CK_Loan_Dates] CHECK (MaturityDate IS NULL OR StartDate IS NULL OR MaturityDate >= StartDate);
ALTER TABLE [treasury].[Loan] CHECK CONSTRAINT [CK_Loan_Dates];
GO
ALTER TABLE [treasury].[LoanRepayment] WITH CHECK ADD CONSTRAINT [CK_LoanRepayment_Amounts] CHECK (PrincipalAmount >= 0 AND InterestAmount >= 0 AND PaidAmount >= 0);
ALTER TABLE [treasury].[LoanRepayment] CHECK CONSTRAINT [CK_LoanRepayment_Amounts];
GO
ALTER TABLE [treasury].[CashFlowForecast] WITH CHECK ADD CONSTRAINT [CK_CashFlowForecast_BucketDates] CHECK (BucketEndDate >= BucketStartDate);
ALTER TABLE [treasury].[CashFlowForecast] CHECK CONSTRAINT [CK_CashFlowForecast_BucketDates];
GO
ALTER TABLE [workflow].[WorkflowInstance] WITH CHECK ADD CONSTRAINT [CK_WorkflowInstance_Scope] CHECK ((ScopeType = BU AND TreasurySubmissionId IS NOT NULL AND ReportVersionId IS NULL) OR (ScopeType = GROUP AND TreasurySubmissionId IS NULL AND ReportVersionId IS NOT NULL));
ALTER TABLE [workflow].[WorkflowInstance] CHECK CONSTRAINT [CK_WorkflowInstance_Scope];
GO
ALTER TABLE [banking].[BankTransaction] WITH CHECK ADD CONSTRAINT [CK_BankTransaction_Amounts] CHECK (DebitAmount >= 0 AND CreditAmount >= 0);
ALTER TABLE [banking].[BankTransaction] CHECK CONSTRAINT [CK_BankTransaction_Amounts];
GO

CREATE UNIQUE NONCLUSTERED INDEX [UX_AppUser_LoginName] ON [sec].[AppUser] ([LoginName]);
GO
CREATE UNIQUE NONCLUSTERED INDEX [UX_SecurityRole_RoleCode] ON [sec].[SecurityRole] ([RoleCode]);
GO
CREATE UNIQUE NONCLUSTERED INDEX [UX_Permission_Code] ON [sec].[Permission] ([PermissionCode]);
GO
CREATE UNIQUE NONCLUSTERED INDEX [UX_Country_Code] ON [ref].[Country] ([CountryCode]);
GO
CREATE UNIQUE NONCLUSTERED INDEX [UX_Currency_Code] ON [ref].[Currency] ([CurrencyCode]);
GO
CREATE UNIQUE NONCLUSTERED INDEX [UX_Bank_Code] ON [ref].[Bank] ([BankCode]);
GO
CREATE UNIQUE NONCLUSTERED INDEX [UX_AccountType_Code] ON [ref].[AccountType] ([AccountTypeCode]);
GO
CREATE UNIQUE NONCLUSTERED INDEX [UX_FacilityType_Code] ON [ref].[FacilityType] ([FacilityTypeCode]);
GO
CREATE UNIQUE NONCLUSTERED INDEX [UX_InvestmentType_Code] ON [ref].[InvestmentType] ([InvestmentTypeCode]);
GO
CREATE UNIQUE NONCLUSTERED INDEX [UX_TreasuryCategory_GroupCode] ON [ref].[TreasuryCategory] ([CategoryGroup], [CategoryCode]);
GO
CREATE UNIQUE NONCLUSTERED INDEX [UX_Organization_Code] ON [org].[Organization] ([OrganizationCode]);
GO
CREATE UNIQUE NONCLUSTERED INDEX [UX_BusinessGroup_OrgCode] ON [org].[BusinessGroup] ([OrganizationId], [BusinessGroupCode]);
GO
CREATE UNIQUE NONCLUSTERED INDEX [UX_BusinessUnit_Code] ON [org].[BusinessUnit] ([BusinessUnitCode]);
GO
CREATE UNIQUE NONCLUSTERED INDEX [UX_LegalEntity_Code] ON [org].[LegalEntity] ([LegalEntityCode]);
GO
CREATE NONCLUSTERED INDEX [IX_UserBusinessUnit_BU] ON [sec].[UserBusinessUnit] ([BusinessUnitId], [AppUserId]);
GO
CREATE UNIQUE NONCLUSTERED INDEX [UX_ReportingPeriod_Code] ON [rpt].[ReportingPeriod] ([PeriodCode]);
GO
CREATE UNIQUE NONCLUSTERED INDEX [UX_ReportingPeriod_Date] ON [rpt].[ReportingPeriod] ([ReportingDate]);
GO
CREATE UNIQUE NONCLUSTERED INDEX [UX_ReportVersion_PeriodVersion] ON [rpt].[ReportVersion] ([ReportingPeriodId], [VersionNo]);
GO
CREATE NONCLUSTERED INDEX [IX_ReportVersion_Status] ON [rpt].[ReportVersion] ([ReportingPeriodId], [VersionStatus]);
GO
CREATE UNIQUE NONCLUSTERED INDEX [UX_TreasurySubmission_PeriodVersionBU] ON [rpt].[TreasurySubmission] ([ReportVersionId], [BusinessUnitId]);
GO
CREATE NONCLUSTERED INDEX [IX_TreasurySubmission_Status] ON [rpt].[TreasurySubmission] ([ReportingPeriodId], [SubmissionStatus], [CurrentStageCode]) INCLUDE ([BusinessUnitId]);
GO
CREATE UNIQUE NONCLUSTERED INDEX [UX_BankAccount_BankNumber] ON [banking].[BankAccount] ([BankId], [AccountNumber]) WHERE IsActive = 1;
GO
CREATE NONCLUSTERED INDEX [IX_BankAccount_BU] ON [banking].[BankAccount] ([BusinessUnitId], [IsActive]) INCLUDE ([BankId], [CurrencyId], [LegalEntityId]);
GO
CREATE UNIQUE NONCLUSTERED INDEX [UX_BankBalance_VersionAccountDate] ON [banking].[BankBalance] ([ReportVersionId], [BankAccountId], [BalanceDate]);
GO
CREATE NONCLUSTERED INDEX [IX_BankBalance_PeriodVersion] ON [banking].[BankBalance] ([ReportingPeriodId], [ReportVersionId], [BalanceDate]) INCLUDE ([BankAccountId], [ClosingBalance], [ReportingCurrencyAmount], [AppliedFXRateId]);
GO
CREATE UNIQUE NONCLUSTERED INDEX [UX_FXRate_PairDateStatus] ON [treasury].[FXRate] ([FromCurrencyId], [ToCurrencyId], [EffectiveDate], [ApprovalStatus]);
GO
CREATE NONCLUSTERED INDEX [IX_FXRate_ApprovedLookup] ON [treasury].[FXRate] ([FromCurrencyId], [ToCurrencyId], [EffectiveDate]) INCLUDE ([ExchangeRate]) WHERE ApprovalStatus = 'Approved';
GO
CREATE NONCLUSTERED INDEX [IX_WCFacility_BankStatus] ON [treasury].[WorkingCapitalFacility] ([BankId], [FacilityStatus]) INCLUDE ([FacilityTypeId], [SanctionedLimit], [ParentFacilityId]);
GO
CREATE UNIQUE NONCLUSTERED INDEX [UX_FacilityUtilization_VersionFacilityDate] ON [treasury].[FacilityUtilization] ([ReportVersionId], [FacilityId], [AsOfDate]);
GO
CREATE NONCLUSTERED INDEX [IX_FacilityUtilization_Period] ON [treasury].[FacilityUtilization] ([ReportingPeriodId], [ReportVersionId]) INCLUDE ([FacilityId], [UtilizedAmount], [AvailableAmount], [UtilizationPct]);
GO
CREATE NONCLUSTERED INDEX [IX_FacilityApplication_PeriodBU] ON [treasury].[FacilityApplication] ([ReportVersionId], [BusinessUnitId], [ApplicationType]) INCLUDE ([AppliedAmount], [ExpectedApprovalAmount], [ApprovedAmount]);
GO
CREATE UNIQUE NONCLUSTERED INDEX [UX_Loan_Reference] ON [treasury].[Loan] ([LoanReference]);
GO
CREATE NONCLUSTERED INDEX [IX_Loan_StatusMaturity] ON [treasury].[Loan] ([LoanStatus], [MaturityDate]) INCLUDE ([CurrentOutstanding], [BankId], [LoanTypeCode]);
GO
CREATE NONCLUSTERED INDEX [IX_LoanRepayment_DueDate] ON [treasury].[LoanRepayment] ([DueDate], [RepaymentStatus]) INCLUDE ([LoanId], [PrincipalAmount], [InterestAmount], [PaidAmount]);
GO
CREATE NONCLUSTERED INDEX [IX_LoanRepayment_Loan] ON [treasury].[LoanRepayment] ([LoanId], [DueDate]) INCLUDE ([PrincipalAmount], [PaidAmount]);
GO
CREATE UNIQUE NONCLUSTERED INDEX [UX_LoanMovement_VersionLoanBucket] ON [treasury].[LoanMovementForecast] ([ReportVersionId], [LoanId], [BucketStartDate]);
GO
CREATE NONCLUSTERED INDEX [IX_Investment_TypeStatus] ON [treasury].[Investment] ([InvestmentTypeId], [InvestmentStatus]) INCLUDE ([BusinessUnitId], [AcquisitionCost], [CurrencyId], [MaturityDate]);
GO
CREATE UNIQUE NONCLUSTERED INDEX [UX_InvestmentValuation_VersionInvestmentDate] ON [treasury].[InvestmentValuation] ([ReportVersionId], [InvestmentId], [ValuationDate]);
GO
CREATE UNIQUE NONCLUSTERED INDEX [UX_EquityValuation_VersionBUDate] ON [treasury].[EquityValuation] ([ReportVersionId], [BusinessUnitId], [ValuationDate]);
GO
CREATE UNIQUE NONCLUSTERED INDEX [UX_CashFlowCategory_Code] ON [treasury].[CashFlowCategory] ([CategoryCode]);
GO
CREATE UNIQUE NONCLUSTERED INDEX [UX_CashFlowForecast_VersionBUCategoryBucket] ON [treasury].[CashFlowForecast] ([ReportVersionId], [BusinessUnitId], [CashFlowCategoryId], [BucketStartDate]);
GO
CREATE NONCLUSTERED INDEX [IX_CashFlowForecast_PeriodBucket] ON [treasury].[CashFlowForecast] ([ReportingPeriodId], [ReportVersionId], [BucketStartDate], [BusinessUnitId]) INCLUDE ([CashFlowCategoryId], [Amount]);
GO
CREATE NONCLUSTERED INDEX [IX_LiquidityAdjustment_PeriodStatus] ON [treasury].[LiquidityAdjustment] ([ReportVersionId], [ApprovalStatus], [AdjustmentType]) INCLUDE ([Amount], [BusinessUnitId]);
GO
CREATE NONCLUSTERED INDEX [IX_WorkflowInstance_Current] ON [workflow].[WorkflowInstance] ([CurrentStageCode], [WorkflowStatus]) INCLUDE ([TreasurySubmissionId], [ReportVersionId]);
GO
CREATE NONCLUSTERED INDEX [IX_WorkflowAction_InstanceTime] ON [workflow].[WorkflowAction] ([WorkflowInstanceId], [ActionAtUtc]) INCLUDE ([ActionCode], [StageCode], [AppUserId], [ToStatus]);
GO
CREATE NONCLUSTERED INDEX [IX_WorkflowComment_Context] ON [workflow].[WorkflowComment] ([ReportVersionId], [BusinessUnitId], [ModuleCode], [CommentStatus]) INCLUDE ([RecordType], [RecordId], [IsExecutiveVisible], [CreatedAtUtc]);
GO
CREATE NONCLUSTERED INDEX [IX_TreasuryException_Open] ON [workflow].[TreasuryException] ([ReportVersionId], [ExceptionStatus], [SeverityCode], [BusinessUnitId]) INCLUDE ([ModuleCode], [RuleCode], [IsBlocking]) WHERE Exception dashboard and CFO gating.;
GO
CREATE UNIQUE NONCLUSTERED INDEX [UX_UploadTemplate_ModuleVersion] ON [ingest].[UploadTemplate] ([ModuleCode], [TemplateVersion]);
GO
CREATE UNIQUE NONCLUSTERED INDEX [UX_UploadTemplateColumn_Ordinal] ON [ingest].[UploadTemplateColumn] ([UploadTemplateId], [ColumnOrdinal]);
GO
CREATE UNIQUE NONCLUSTERED INDEX [UX_UploadTemplateColumn_Name] ON [ingest].[UploadTemplateColumn] ([UploadTemplateId], [ColumnName]);
GO
CREATE NONCLUSTERED INDEX [IX_UploadBatch_Context] ON [ingest].[UploadBatch] ([ReportVersionId], [BusinessUnitId], [ModuleCode], [UploadedAtUtc]) INCLUDE ([BatchStatus], [ValidRows], [InvalidRows]);
GO
CREATE NONCLUSTERED INDEX [IX_UploadBatch_Hash] ON [ingest].[UploadBatch] ([FileHash]);
GO
CREATE UNIQUE NONCLUSTERED INDEX [UX_UploadDetail_BatchRow] ON [ingest].[UploadDetail] ([UploadBatchId], [SourceRowNo]);
GO
CREATE NONCLUSTERED INDEX [IX_UploadDetail_Status] ON [ingest].[UploadDetail] ([UploadBatchId], [ImportStatus]) INCLUDE ([TargetRecordType], [TargetRecordId]);
GO
CREATE NONCLUSTERED INDEX [IX_ValidationError_Open] ON [ingest].[ValidationError] ([ReportVersionId], [ValidationStatus], [SeverityCode]) INCLUDE ([UploadBatchId], [SourceRowNo], [FieldName], [RuleCode]);
GO
CREATE NONCLUSTERED INDEX [IX_Attachment_Context] ON [ingest].[Attachment] ([ReportVersionId], [BusinessUnitId], [ModuleCode], [RecordType], [RecordId]) INCLUDE ([OriginalFileName], [UploadedAtUtc]);
GO
CREATE UNIQUE NONCLUSTERED INDEX [UX_TreasurySnapshot_ReportVersion] ON [rpt].[TreasurySnapshot] ([ReportVersionId]);
GO
CREATE NONCLUSTERED INDEX [IX_TreasurySnapshot_Published] ON [rpt].[TreasurySnapshot] ([ReportingPeriodId], [SnapshotStatus], [PublishedAtUtc]) INCLUDE ([AudienceScope], [ReportVersionId]);
GO
CREATE UNIQUE NONCLUSTERED INDEX [IX_SnapshotKPI_KeyDimension] ON [rpt].[SnapshotKPI] ([TreasurySnapshotId], [KPIKey], [DimensionType], [DimensionKey]) INCLUDE ([NumericValue], [DisplayValue], [DisplayUnit]);
GO
CREATE NONCLUSTERED INDEX [IX_SnapshotDetail_ModuleBU] ON [rpt].[SnapshotDetail] ([TreasurySnapshotId], [ModuleCode], [BusinessUnitCode]) INCLUDE ([RecordType], [SourceRecordId]);
GO
CREATE NONCLUSTERED INDEX [IX_SnapshotComment_Module] ON [rpt].[SnapshotComment] ([TreasurySnapshotId], [ModuleCode], [BusinessUnitCode], [SequenceNo]);
GO
CREATE NONCLUSTERED INDEX [IX_Notification_Queue] ON [notify].[Notification] ([DeliveryStatus], [QueuedAtUtc]) INCLUDE ([RecipientUserId], [NotificationType], [ChannelCode]);
GO
CREATE NONCLUSTERED INDEX [IX_Notification_User] ON [notify].[Notification] ([RecipientUserId], [QueuedAtUtc]) INCLUDE ([DeliveryStatus], [NotificationType]);
GO
CREATE NONCLUSTERED INDEX [IX_AuditLog_Time] ON [audit].[AuditLog] ([EventAtUtc]) INCLUDE ([AppUserId], [ActionCode], [ModuleCode]);
GO
CREATE NONCLUSTERED INDEX [IX_AuditLog_Record] ON [audit].[AuditLog] ([ModuleCode], [RecordType], [RecordId], [EventAtUtc]) INCLUDE ([ActionCode], [AppUserId], [SecurityRoleId]);
GO
CREATE NONCLUSTERED INDEX [IX_AuditLog_Correlation] ON [audit].[AuditLog] ([CorrelationId], [EventAtUtc]);
GO
CREATE UNIQUE NONCLUSTERED INDEX [UX_Configuration_KeyEffective] ON [cfg].[Configuration] ([ConfigGroup], [ConfigKey], [EffectiveFrom]);
GO
CREATE NONCLUSTERED INDEX [IX_BankTransaction_AccountDate] ON [banking].[BankTransaction] ([BankAccountId], [TransactionDate]) INCLUDE ([ValueDate], [DebitAmount], [CreditAmount], [RunningBalance]);
GO

-- Recommended deployment sequencing: seed reference values, roles/permissions, then master data, then reporting periods and operational data.
-- Do not grant direct table DML to end users. Application access should be through the ASP.NET Core service identity and controlled application authorization.
-- Consider SQL Server Row-Level Security as defense in depth for BU-scoped tables after the final user/BU access model is approved.