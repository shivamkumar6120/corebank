package com.corebank.service;

import com.corebank.domain.TransactionDirection;
import com.corebank.domain.TransactionType;
import com.corebank.entity.Account;
import com.corebank.entity.BankTransaction;
import com.corebank.exception.ApiException;
import com.corebank.repository.AccountRepository;
import com.corebank.repository.TransactionRepository;
import com.corebank.util.BankSupport;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;

@Service
public class LedgerService {

    private static final BigDecimal MIN = new BigDecimal("1.00");
    private static final BigDecimal MAX = new BigDecimal("1000000.00");

    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;

    public LedgerService(AccountRepository accountRepository, TransactionRepository transactionRepository) {
        this.accountRepository = accountRepository;
        this.transactionRepository = transactionRepository;
    }

    public BigDecimal money(BigDecimal amount) {
        if (amount == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Enter an amount");
        }
        BigDecimal scaled = amount.setScale(2, RoundingMode.HALF_UP);
        if (scaled.compareTo(MIN) < 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Amount must be at least ₹1");
        }
        if (scaled.compareTo(MAX) > 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Amount cannot exceed ₹10,00,000 per transaction");
        }
        return scaled;
    }

    @Transactional
    public BankTransaction post(
            Account account,
            TransactionType type,
            BigDecimal amount,
            String description,
            String counterpartyName,
            String counterpartyAccount,
            String reference,
            String remarks,
            String category,
            LocalDateTime when
    ) {
        BigDecimal value = amount.setScale(2, RoundingMode.HALF_UP);
        TransactionDirection direction = directionOf(type);
        if (direction == TransactionDirection.DEBIT && account.getBalance().compareTo(value) < 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Insufficient balance in account ending " + BankSupport.last4(account.getAccountNumber()));
        }
        BigDecimal updated = direction == TransactionDirection.CREDIT
                ? account.getBalance().add(value)
                : account.getBalance().subtract(value);
        account.setBalance(updated.setScale(2, RoundingMode.HALF_UP));
        accountRepository.save(account);

        BankTransaction txn = new BankTransaction();
        txn.setAccount(account);
        txn.setType(type);
        txn.setDirection(direction);
        txn.setAmount(value);
        txn.setBalanceAfter(account.getBalance());
        txn.setDescription(description);
        txn.setCounterpartyName(counterpartyName);
        txn.setCounterpartyAccount(counterpartyAccount);
        txn.setReferenceNumber(reference);
        txn.setRemarks(remarks);
        txn.setCategory(category);
        txn.setCreatedAt(when == null ? LocalDateTime.now() : when);
        return transactionRepository.save(txn);
    }

    public TransactionDirection directionOf(TransactionType type) {
        return switch (type) {
            case DEPOSIT, TRANSFER_IN -> TransactionDirection.CREDIT;
            case WITHDRAWAL, TRANSFER_OUT, BILL_PAYMENT, MOBILE_RECHARGE -> TransactionDirection.DEBIT;
        };
    }
}
