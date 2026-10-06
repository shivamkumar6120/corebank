package com.corebank.service;

import com.corebank.domain.AccountStatus;
import com.corebank.domain.AccountType;
import com.corebank.domain.TransactionType;
import com.corebank.dto.Mappers;
import com.corebank.dto.Requests;
import com.corebank.dto.Responses;
import com.corebank.entity.Account;
import com.corebank.entity.BankTransaction;
import com.corebank.entity.User;
import com.corebank.exception.ApiException;
import com.corebank.repository.AccountRepository;
import com.corebank.util.BankSupport;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class AccountService {

    private static final String IFSC = "CRBK0001234";
    private static final String BRANCH = "MG Road, Bengaluru";
    private static final Set<String> DEPOSIT_METHODS = Set.of("CASH", "UPI", "CHEQUE");

    private final AccountRepository accountRepository;
    private final LedgerService ledgerService;
    private final NotificationService notificationService;
    private final PasswordEncoder passwordEncoder;

    public AccountService(
            AccountRepository accountRepository,
            LedgerService ledgerService,
            NotificationService notificationService,
            PasswordEncoder passwordEncoder
    ) {
        this.accountRepository = accountRepository;
        this.ledgerService = ledgerService;
        this.notificationService = notificationService;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public List<Responses.AccountView> list(User user) {
        return accountRepository.findByUserIdOrderByIdAsc(user.getId()).stream().map(Mappers::account).toList();
    }

    @Transactional(readOnly = true)
    public Responses.AccountView get(User user, Long id) {
        return Mappers.account(requireOwned(id, user.getId()));
    }

    @Transactional
    public Account open(User user, AccountType type) {
        Account account = new Account();
        account.setUser(user);
        account.setAccountNumber(nextNumber());
        account.setAccountType(type);
        account.setBalance(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));
        account.setCurrency("INR");
        account.setStatus(AccountStatus.ACTIVE);
        account.setIfsc(IFSC);
        account.setBranch(BRANCH);
        account.setCreatedAt(LocalDateTime.now());
        return accountRepository.save(account);
    }

    @Transactional
    public Account openWithNumber(User user, AccountType type, String number, String branch, LocalDateTime createdAt) {
        Account account = new Account();
        account.setUser(user);
        account.setAccountNumber(number);
        account.setAccountType(type);
        account.setBalance(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));
        account.setCurrency("INR");
        account.setStatus(AccountStatus.ACTIVE);
        account.setIfsc(IFSC);
        account.setBranch(branch);
        account.setCreatedAt(createdAt);
        return accountRepository.save(account);
    }

    @Transactional
    public Responses.Receipt deposit(User user, Requests.Deposit request) {
        String method = request.method().trim().toUpperCase();
        if (!DEPOSIT_METHODS.contains(method)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Choose Cash, UPI, or Cheque");
        }
        BigDecimal amount = ledgerService.money(request.amount());
        Account account = lockOwned(request.accountId(), user.getId());
        String reference = BankSupport.reference();
        String label = switch (method) {
            case "UPI" -> "UPI deposit";
            case "CHEQUE" -> "Cheque deposit";
            default -> "Cash deposit";
        };
        BankTransaction txn = ledgerService.post(
                account,
                TransactionType.DEPOSIT,
                amount,
                label,
                "CoreBank",
                null,
                reference,
                BankSupport.remarks(request.remarks()),
                "Income",
                null
        );
        notificationService.push(user, "Money added",
                "₹" + amount.toPlainString() + " was credited to your " + pretty(account.getAccountType()) + " account.",
                com.corebank.domain.NotificationType.SUCCESS);
        return receipt("Deposit successful", txn, account.getAccountNumber(), account.getAccountNumber(), label);
    }

    @Transactional
    public Responses.Receipt withdraw(User user, Requests.Withdraw request) {
        verifyPin(user, request.pin());
        BigDecimal amount = ledgerService.money(request.amount());
        Account account = lockOwned(request.accountId(), user.getId());
        String reference = BankSupport.reference();
        BankTransaction txn = ledgerService.post(
                account,
                TransactionType.WITHDRAWAL,
                amount,
                "Cash withdrawal",
                "CoreBank",
                null,
                reference,
                BankSupport.remarks(request.remarks()),
                "Cash",
                null
        );
        notificationService.push(user, "Withdrawal completed",
                "₹" + amount.toPlainString() + " was withdrawn from your " + pretty(account.getAccountType()) + " account.",
                com.corebank.domain.NotificationType.INFO);
        return receipt("Withdrawal successful", txn, account.getAccountNumber(), account.getAccountNumber(), "Cash withdrawal");
    }

    @Transactional
    public Account lockOwned(Long accountId, Long userId) {
        Account account = accountRepository.lockById(accountId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Account not found"));
        assertOwned(account, userId);
        return account;
    }

    @Transactional(readOnly = true)
    public Account requireOwned(Long accountId, Long userId) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Account not found"));
        assertOwned(account, userId);
        return account;
    }

    public void verifyPin(User user, String pin) {
        if (pin == null || !pin.matches("\\d{4}")) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Enter your 4-digit transaction PIN");
        }
        if (user.getTransactionPinHash() == null || !passwordEncoder.matches(pin, user.getTransactionPinHash())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Incorrect transaction PIN");
        }
    }

    public Responses.Receipt receipt(String title, BankTransaction txn, String from, String to, String toName) {
        return new Responses.Receipt(
                txn.getReferenceNumber(),
                txn.getAmount(),
                title,
                from,
                to,
                toName,
                txn.getBalanceAfter(),
                txn.getCreatedAt(),
                txn.getRemarks()
        );
    }

    public String pretty(AccountType type) {
        return type == AccountType.SAVINGS ? "Savings" : "Current";
    }

    private void assertOwned(Account account, Long userId) {
        if (!account.getUser().getId().equals(userId)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Account not found");
        }
        if (account.getStatus() != AccountStatus.ACTIVE) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "This account is not active");
        }
    }

    private String nextNumber() {
        for (int attempt = 0; attempt < 20; attempt++) {
            long body = ThreadLocalRandom.current().nextLong(100_000_000L, 1_000_000_000L);
            String number = "501" + body;
            if (!accountRepository.existsByAccountNumber(number)) {
                return number;
            }
        }
        throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not generate an account number");
    }
}
