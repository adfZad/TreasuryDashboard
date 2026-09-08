TREASURY OFFLINE DASHBOARD
==========================

Source
------
Built from: Treasury report as on 15Aug2026.xlsx
Report date: 15 August 2026

How to run
----------
1. Keep index.html, styles.css and app.js in the same folder.
2. Double click index.html.
3. The dashboard works without internet access and without a web server.

Main features
-------------
* Executive treasury dashboard
* Funds position
* Cash flow projection
* Working capital facility utilisation
* Short term and long term loan views
* Debt and liquidity ratios
* Projected loan movement
* Offline data input
* Comments and approval workflow prototype
* Local JSON export and import

Data storage
------------
Edits and workflow comments are stored in the browser's localStorage on the machine where the application is opened. No information is sent anywhere.

Important source note
---------------------
The Debt & Equity worksheet in the source Excel file contains #REF! formulas. The web prototype recalculates the current Debt / Equity and liquidity ratios using valid current balances from the workbook.

IIS / SQL Server next phase
---------------------------
This offline version is a front end prototype. It can later be converted to an IIS hosted application with SQL Server, authentication, Business Unit data entry, role based approvals, audit history, Excel upload and a central reporting database.
