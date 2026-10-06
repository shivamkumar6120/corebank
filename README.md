# CoreBank

Digital banking and fund transfer portal for an MCA minor project. The interface is a polished internet-banking desk. The backend is a small Spring Boot API that keeps accounts, beneficiaries, and transactions in MySQL.

## What you can do

1. Register and sign in
2. Simulated OTP verification (the code is shown on screen; there is no SMS gateway)
3. Forgot and reset password
4. Dashboard with balances, quick actions, and a 7-day chart
5. Account details and balance
6. Transfer between your own accounts
7. Transfer to another account (CoreBank accounts are credited instantly; other banks are recorded as a simulated NEFT)
8. Add, edit, and remove beneficiaries
9. Searchable transaction history
10. Mini statement
11. Download a statement as PDF
12. Deposit money
13. Withdraw money
14. Bill payment and mobile recharge
15. Update profile
16. Change the transaction PIN
17. Notifications
18. Sign out

## Demo profile

| | |
|---|---|
| Email | `demo@corebank.app` |
| Password | `Demo@1234` |
| Transaction PIN | `2580` |
| Savings | `501000112233` — ₹48,450.50 |
| Current | `501000112244` — ₹26,800.00 |

Priya Nair is already saved as a beneficiary, so an “other account” transfer can credit a real second customer inside the database.

An admin signs in on the same screen and lands on `/admin`.

| | |
|---|---|
| Email | `admin@corebank.app` |
| Password | `Admin@1234` |

New registrations start at ₹0 and receive both a Savings and a Current account after OTP verification.

## Run it locally

You need **Java 21**, **Node.js 20+**, and **Docker Desktop**.

Port **8080** is left free on purpose. The API listens on **8088**, because Docker Desktop often binds 8080. MySQL from this project is published on **3307** so it does not clash with a local MySQL already using 3306.

### 1. Database

From the project root:

```powershell
docker compose up -d
```

This starts MySQL 8 with database `corebank`, user `root`, password `corebank`.

### 2. Backend

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

On the first launch, Hibernate creates the tables and seeds the demo profile. API base URL: `http://localhost:8088/api`.

If you prefer an existing MySQL server, point the app at it before starting:

```powershell
$env:SPRING_DATASOURCE_URL = "jdbc:mysql://localhost:3306/corebank?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Kolkata"
$env:SPRING_DATASOURCE_USERNAME = "root"
$env:SPRING_DATASOURCE_PASSWORD = "your-password"
.\mvnw.cmd spring-boot:run
```

### 3. Frontend

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. Use **Use the demo profile** on the sign-in screen, then enter the one-time code shown in the blue banner.

## Project layout

```
backend/     Spring Boot API (controllers, services, JPA entities)
frontend/    React + Tailwind banking UI
docker-compose.yml
```

Tables: `users`, `accounts`, `beneficiaries`, `transactions`, `otp_challenges`, `notifications`. Accounts belong to a user. Each transaction row belongs to one account, so a transfer writes a debit and a credit that share a reference number.

Passwords and transaction PINs are stored with BCrypt. Sign-in returns a JWT only after the OTP step. Logout clears that token in the browser.
