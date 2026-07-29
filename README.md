# 🏗️ AlMadina Building Material ERP (Offline Desktop Application)

An enterprise-grade, fully offline desktop ERP & POS software built specifically for **AlMadina Building Material Uthal**. Designed to run seamlessly without any active internet, LAN, or external network connection using an embedded SQLite database engine.

---

## ✨ Features

- **🛍️ Complete Point of Sale (POS) & Sales Management**
  - Sale Invoices, Counter POS Sales, Sale Orders, and Sale Returns.
  - Multi-unit pricing (Cartons, Bags, Feet, Items).
  - Real-time stock availability and party credit balance checks.

- **📦 Inventory & Stock Control**
  - Hierarchical Category & Subcategory filtering.
  - Stock Movement tracking, Low Stock alerts, and Reorder point management.
  - Automated cost & rate calculations.

- **🛒 Purchases & Supplier Management**
  - Purchase Invoices, Orders, and Purchase Returns.
  - Supplier Ledgers, Payables, and Payment Voucher processing.

- **💰 Accounting & Financial Reports**
  - General Ledger, Chart of Accounts, Cash/Bank Vouchers.
  - Balance Sheet, Profit & Loss Statement, and Trial Balance reports.
  - Daily Cash Book & Party Balances.

- **🖨️ Customizable Thermal & A4/A5 Printing**
  - Full support for 80mm Thermal Receipt printers and standard A4/A5 invoices.
  - PDF Export feature for all invoice types.
  - Professional bilingual (Urdu/English) bill headers.

- **💾 100% Offline SQLite Engine**
  - Local database storage automatically stored in `Documents/AlMadina ERP/almadina.db`.
  - Zero external database setup or server configuration required.
  - Built-in backup & data export tools.

---

## 🛠️ Technology Stack

- **Framework**: Next.js 14 (App Router) + React 18
- **Desktop Wrapper**: Electron 33
- **Database**: SQLite 3 (`better-sqlite3` native bindings)
- **Styling**: TailwindCSS
- **PDF & Canvas Engine**: jsPDF, html2canvas
- **Packaging**: `electron-builder` (NSIS Installer & Portable EXE)

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- `npm` (v9 or higher)

### Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/nasrqasim/AL-Madina-Building-Material-Uthal-Offline-app.git
   cd AL-Madina-Building-Material-Uthal-Offline-app
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Run in Development Mode**
   ```bash
   npm run dev
   ```

4. **Launch Electron Desktop App (Dev)**
   ```bash
   npm run electron:dev
   ```

---

## 📦 Building the Executable (.exe)

To generate standalone Windows installer (`.exe`) and portable packages:

```bash
npm run dist
```

Output binaries will be generated in the `dist/` directory:
- `dist/AlMadina ERP Setup.exe` (NSIS Installer)
- `dist/AlMadina ERP Portable.exe` (Standalone Portable App)

---

## 🔐 Login

Default credentials are configured during initial setup. Contact the administrator for access.

---

## 📄 License

Private & Proprietary software developed for **AlMadina Building Material Uthal**. All rights reserved.
