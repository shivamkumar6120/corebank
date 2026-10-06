package com.corebank.seed;

import com.corebank.domain.AccountType;
import com.corebank.domain.NotificationType;
import com.corebank.domain.TransactionType;
import com.corebank.entity.Account;
import com.corebank.entity.Beneficiary;
import com.corebank.entity.User;
import com.corebank.repository.BeneficiaryRepository;
import com.corebank.repository.UserRepository;
import com.corebank.service.AccountService;
import com.corebank.service.LedgerService;
import com.corebank.service.NotificationService;
import com.corebank.util.BankSupport;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Component
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final UserRepository userRepository;
    private final BeneficiaryRepository beneficiaryRepository;
    private final AccountService accountService;
    private final LedgerService ledgerService;
    private final NotificationService notificationService;
    private final PasswordEncoder passwordEncoder;
    private final TransactionTemplate transactionTemplate;

    public DataSeeder(
            UserRepository userRepository,
            BeneficiaryRepository beneficiaryRepository,
            AccountService accountService,
            LedgerService ledgerService,
            NotificationService notificationService,
            PasswordEncoder passwordEncoder,
            TransactionTemplate transactionTemplate
    ) {
        this.userRepository = userRepository;
        this.beneficiaryRepository = beneficiaryRepository;
        this.accountService = accountService;
        this.ledgerService = ledgerService;
        this.notificationService = notificationService;
        this.passwordEncoder = passwordEncoder;
        this.transactionTemplate = transactionTemplate;
    }

    @Override
    public void run(String... args) {
        transactionTemplate.executeWithoutResult(status -> {
            if (userRepository.count() == 0) {
                seed();
            }
            ensureAdmin();
        });
    }

    private void seed() {
        User aarav = user("Aarav Mehta", "demo@corebank.app", "9876543210", "12 Residency Road, Bengaluru", LocalDate.of(1998, 4, 12), "2580");
        User priya = user("Priya Nair", "priya@corebank.app", "9123456780", "44 Marine Drive, Kochi", LocalDate.of(1999, 11, 2), "2468");

        Account savings = accountService.openWithNumber(aarav, AccountType.SAVINGS, "501000112233", "MG Road, Bengaluru", at(21, 9, 0));
        Account current = accountService.openWithNumber(aarav, AccountType.CURRENT, "501000112244", "MG Road, Bengaluru", at(21, 9, 5));
        Account priyaSavings = accountService.openWithNumber(priya, AccountType.SAVINGS, "501000778899", "Marine Drive, Kochi", at(30, 10, 0));

        post(priyaSavings, TransactionType.DEPOSIT, "20000", "Opening deposit", "UPI", null, "Income", at(30, 10, 15));
        post(savings, TransactionType.DEPOSIT, "25000.00", "Opening deposit", "UPI", null, "Income", at(20, 9, 30));
        post(savings, TransactionType.TRANSFER_IN, "85000.00", "Salary · Northwind Analytics", "Northwind Analytics", null, "Income", at(18, 9, 5));
        post(savings, TransactionType.TRANSFER_OUT, "32000.00", "Rent · Greenleaf Apartments", "Greenleaf Apartments", "004412239900", "Housing", at(17, 11, 20));
        post(current, TransactionType.DEPOSIT, "15000.00", "Initial funding", "UPI", null, "Income", at(15, 16, 0));
        post(savings, TransactionType.BILL_PAYMENT, "2340.50", "BESCOM electricity", "BESCOM", "BES1029384", "Bills", at(14, 19, 10));
        post(savings, TransactionType.TRANSFER_OUT, "486.00", "Swiggy", "Swiggy", null, "Food", at(12, 21, 5));
        post(savings, TransactionType.TRANSFER_OUT, "3299.00", "Amazon", "Amazon", null, "Shopping", at(10, 13, 40));
        post(savings, TransactionType.WITHDRAWAL, "5000.00", "ATM withdrawal · MG Road", "CoreBank ATM", null, "Cash", at(9, 18, 12));
        post(savings, TransactionType.MOBILE_RECHARGE, "299.00", "Jio prepaid · 9876543210", "Jio", "9876543210", "Recharge", at(8, 8, 45));

        String ownRef = BankSupport.reference();
        ledgerService.post(savings, TransactionType.TRANSFER_OUT, new BigDecimal("10000.00"),
                "To own Current account", aarav.getFullName(), current.getAccountNumber(), ownRef, "Buffer for vendors", "Transfer", at(7, 11, 15));
        ledgerService.post(current, TransactionType.TRANSFER_IN, new BigDecimal("10000.00"),
                "From own Savings account", aarav.getFullName(), savings.getAccountNumber(), ownRef, "Buffer for vendors", "Transfer", at(7, 11, 15));

        String priyaRef = BankSupport.reference();
        ledgerService.post(savings, TransactionType.TRANSFER_OUT, new BigDecimal("7500.00"),
                "To Priya Nair", "Priya Nair", priyaSavings.getAccountNumber(), priyaRef, "Family", "Transfer", at(6, 18, 40));
        ledgerService.post(priyaSavings, TransactionType.TRANSFER_IN, new BigDecimal("7500.00"),
                "From Aarav Mehta", aarav.getFullName(), savings.getAccountNumber(), priyaRef, "Family", "Transfer", at(6, 18, 40));

        post(current, TransactionType.TRANSFER_OUT, "4200.00", "Vendor payment · Pixel Studio", "Pixel Studio", "778899001122", "Transfer", at(5, 15, 5));
        post(savings, TransactionType.TRANSFER_OUT, "1240.00", "Nature's Basket", "Nature's Basket", null, "Food", at(4, 19, 30));
        post(savings, TransactionType.TRANSFER_IN, "1800.00", "Refund · Amazon", "Amazon", null, "Shopping", at(3, 12, 10));
        post(savings, TransactionType.TRANSFER_OUT, "356.00", "Uber", "Uber", null, "Transport", at(2, 22, 18));
        post(savings, TransactionType.BILL_PAYMENT, "649.00", "Netflix · UPI Autopay", "Netflix", null, "Entertainment", at(1, 7, 0));
        post(current, TransactionType.TRANSFER_IN, "6000.00", "Freelance receipt", "Pixel Studio", null, "Income", at(1, 17, 25));
        ledgerService.post(savings, TransactionType.TRANSFER_OUT, new BigDecimal("180.00"),
                "Third Wave Coffee", "Third Wave Coffee", null, BankSupport.reference(), null, "Food", LocalDateTime.now().minusMinutes(90));

        beneficiary(aarav, "Priya Nair", "Priya", priyaSavings.getAccountNumber(), "CoreBank", "CRBK0001234", at(12, 10, 0));
        beneficiary(aarav, "Rahul Verma", "Rahul", "882210045671", "HDFC Bank", "HDFC0001234", at(11, 10, 0));
        beneficiary(aarav, "Greenleaf Apartments", "Landlord", "004412239900", "ICICI Bank", "ICIC0000456", at(17, 11, 0));

        notificationService.push(aarav, "Welcome to CoreBank", "Your Savings and Current accounts are active.", NotificationType.SUCCESS, at(21, 9, 10), true);
        notificationService.push(aarav, "Salary credited", "₹85,000.00 from Northwind Analytics has been credited.", NotificationType.SUCCESS, at(18, 9, 6), true);
        notificationService.push(aarav, "Bill paid", "BESCOM electricity bill of ₹2,340.50 was paid.", NotificationType.INFO, at(14, 19, 11), true);
        notificationService.push(aarav, "Transfer sent", "₹7,500.00 was sent to Priya Nair.", NotificationType.SUCCESS, at(6, 18, 41), true);
        notificationService.push(aarav, "Money received", "₹6,000.00 freelance receipt was credited to your Current account.", NotificationType.SUCCESS, at(1, 17, 26), false);
        notificationService.push(aarav, "Review your beneficiaries", "Three payees are saved and ready for your next transfer.", NotificationType.INFO, LocalDateTime.now().minusHours(3), false);
        notificationService.push(priya, "Money received", "Aarav Mehta sent you ₹7,500.00.", NotificationType.SUCCESS, at(6, 18, 41), false);

        log.info("Seeded demo login demo@corebank.app / Demo@1234 / PIN 2580");
        log.info("Savings {} balance {}", savings.getAccountNumber(), savings.getBalance());
        log.info("Current {} balance {}", current.getAccountNumber(), current.getBalance());
    }

    private User user(String name, String email, String phone, String address, LocalDate dob, String pin) {
        User user = new User();
        user.setFullName(name);
        user.setEmail(email);
        user.setPhone(phone);
        user.setAddress(address);
        user.setDateOfBirth(dob);
        user.setPasswordHash(passwordEncoder.encode("Demo@1234"));
        user.setTransactionPinHash(passwordEncoder.encode(pin));
        user.setEnabled(true);
        user.setAdmin(false);
        user.setCreatedAt(at(21, 9, 0));
        return userRepository.save(user);
    }

    private void ensureAdmin() {
        if (userRepository.existsByEmail("admin@corebank.app")) {
            return;
        }
        User admin = new User();
        admin.setFullName("CoreBank Admin");
        admin.setEmail("admin@corebank.app");
        admin.setPhone("9000000001");
        admin.setAddress("CoreBank Operations");
        admin.setPasswordHash(passwordEncoder.encode("Admin@1234"));
        admin.setEnabled(true);
        admin.setAdmin(true);
        admin.setCreatedAt(LocalDateTime.now());
        userRepository.save(admin);
        log.info("Seeded admin login admin@corebank.app / Admin@1234");
    }

    private void post(Account account, TransactionType type, String amount, String description, String counterparty, String counterpartyAccount, String category, LocalDateTime when) {
        ledgerService.post(account, type, new BigDecimal(amount), description, counterparty, counterpartyAccount, BankSupport.reference(), null, category, when);
    }

    private void beneficiary(User user, String name, String nickname, String number, String bank, String ifsc, LocalDateTime when) {
        Beneficiary beneficiary = new Beneficiary();
        beneficiary.setUser(user);
        beneficiary.setName(name);
        beneficiary.setNickname(nickname);
        beneficiary.setAccountNumber(number);
        beneficiary.setBankName(bank);
        beneficiary.setIfsc(ifsc);
        beneficiary.setCreatedAt(when);
        beneficiaryRepository.save(beneficiary);
    }

    private LocalDateTime at(int daysAgo, int hour, int minute) {
        return LocalDate.now().minusDays(daysAgo).atTime(hour, minute);
    }
}
