# Pharmacy POS: User Guide & Walkthrough

This guide explains how to use the specific pharmacy features implemented in the application.

## 1. How to Run (Docker - Recommended)
This is the easiest way to run the full system without environment issues.

1.  **Install Docker Desktop**: [Download](https://www.docker.com/products/docker-desktop/)
2.  **Start System**:
    Double-click `start_docker.bat` (or run `docker-compose up --build`).
3.  **Access**:
    - Frontend: `http://localhost` (Port 80)
    - Backend: `http://localhost:3000`

## 2. How to Run (Manual / Legacy)
If you prefer running locally with Node.js:

1.  **Install Node.js**: [Download](https://nodejs.org/en)
2.  **Install Dependencies**:
    ```bash
    npm install
    ```
3.  **Start Backend**:
    ```bash
    npm run dev --workspace=@pos/server
    ```
4.  **Start Frontend**:
    ```bash
    npm run dev --workspace=@pos/web
    ```

## 3. Database Setup
If running manually, execute `docs/schema.sql` in your Postgres tool.
If running via Docker, the database is auto-created.

### Auto-Schema for Docker
Connect to the Docker Postgres instance (Port 5432, user: postgres, pass: postgres) and run the `docs/schema.sql` script.

## 4. Point of Sale (POS) Flow

### Standard Sale
1.  Navigate to the POS Screen.
2.  Scan a barcode or search for items (e.g., "Panadol").
3.  Items are added to the **Cart** on the left.
4.  Total is calculated automatically.

### Prescription Sale (Regulated)
1.  Click **"Attach Customer"** in the header.
2.  Search for a patient (or create new).
3.  Once attached, the **Prescriptions Panel** appears on the right.
4.  View "Pending" prescriptions from Doctors.
5.  Click **"Fill"** on a prescription item.
6.  The system adds the item to the cart with the correct **Dosage Instructions** attached.

### Loyalty Redemption
1.  Attach a Customer.
2.  Their **Loyalty Tier** (Gold/Silver) is displayed in the header badge.
3.  Completing the sale automatically awards points to their account.

## 5. Inventory Management (Back Office)

### Receiving Stock (Stock In)
- Use the API Endpoint `POST /inventory/receive` (UI typically in Back Office Dashboard).
- Required fields: `batchNumber`, `expiryDate`, `quantity`.
- **System Action**: Creates a new `InventoryBatch` record.

### Selling (Stock Out)
- When a sale is completed, the system runs the **FEFO Algorithm**.
- It looks for batches of the product.
- It deducts from the batch with the **Earliest Expiry Date**.
- If a batch is depleted, it moves to the next batch seamlessly.

## 6. Offline Capabilities

### Handling Disconnection
- If the internet cuts out, a **Red Offline Badge** appears in the POS header.
- You can continue to scan items and complete sales.
- Transactions are saved to the **Local Browser Database** (Dexie.js).

### Restoring Connection
- When internet returns, the Badge turns **Green**.
- The **Sync Engine** automatically pushes all offline transactions to the server.
- The Inventory counts on the server are updated.

## 7. Reports

- Access `GET /reports/sales/daily` for a revenue summary.
- Access `GET /reports/inventory/expiring` to see what drugs need to be cleared from shelves (Compliance).

## 8. User Management (Admin)

### Resetting a User's Password
1. Navigate to the User Management screen (typically in the Back Office).
2. Find the user in the list.
3. Click the "Reset Password" button next to their name.
4. Confirm the action in the popup dialog.
5. The system will generate a new, temporary password.
6. A notification will appear with the new password. Securely provide this to the user, who should be prompted to change it upon their next login.
