package com.corebank.service;

import com.corebank.domain.AccountStatus;
import com.corebank.domain.NotificationType;
import com.corebank.domain.TransactionType;
import com.corebank.dto.Requests;
import com.corebank.dto.Responses;
import com.corebank.entity.Account;
import com.corebank.entity.BankTransaction;
import com.corebank.entity.Beneficiary;
import com.corebank.entity.User;
import com.corebank.exception.ApiException;
import com.corebank.repository.AccountRepository;
import com.corebank.repository.BeneficiaryRepository;
import com.corebank.util.BankSupport;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
public class TransferService {

    private final AccountService accountService;
    private final AccountRepository accountRepository;
    private final BeneficiaryRepository beneficiaryRepository;
    private final LedgerService ledgerService;
    private final NotificationService notificationService;

    public TransferService(
            AccountService accountService,
            AccountRepository accountRepository,
            BeneficiaryRepository beneficiaryRepository,
            LedgerService ledgerService,
            NotificationService notificationService
    ) {
        this.accountService = accountService;
        this.accountRepository = accountRepository;
        this.beneficiaryRepository = beneficiaryRepository;
        this.ledgerService = ledgerService;
        this.notificationService = notificationService;
    }

    @Transactional
    public Responses.Receipt own(User user, Requests.OwnTransfer request) {
        accountService.verifyPin(user, request.pin());
        if (request.fromAccountId().equals(request.toAccountId())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Choose two different accounts");
        }
        BigDecimal amount = ledgerService.money(request.amount());
        long low = Math.min(request.fromAccountId(), request.toAccountId());
        long high = Math.max(request.fromAccountId(), request.toAccountId());
        Account first = accountService.lockOwned(low, user.getId());
        Account second = accountService.lockOwned(high, user.getId());
        Account from = request.fromAccountId().equals(first.getId()) ? first : second;
        Account to = request.toAccountId().equals(first.getId()) ? first : second;

        String reference = BankSupport.reference();
        String remarks = BankSupport.remarks(request.remarks());
        String toLabel = "Own " + accountService.pretty(to.getAccountType()) + " account";
        BankTransaction debit = ledgerService.post(
                from, TransactionType.TRANSFER_OUT, amount,
                "To " + toLabel, user.getFullName(), to.getAccountNumber(),
                reference, remarks, "Transfer", null);
        ledgerService.post(
                to, TransactionType.TRANSFER_IN, amount,
                "From own " + accountService.pretty(from.getAccountType()) + " account",
                user.getFullName(), from.getAccountNumber(),
                reference, remarks, "Transfer", null);
        notificationService.push(user, "Transfer completed",
                "₹" + amount.toPlainString() + " moved to your " + accountService.pretty(to.getAccountType()) + " account.",
                NotificationType.SUCCESS);
        return accountService.receipt("Transfer successful", debit, from.getAccountNumber(), to.getAccountNumber(), toLabel);
    }

    @Transactional
    public Responses.Receipt other(User user, Requests.OtherTransfer request) {
        accountService.verifyPin(user, request.pin());
        BigDecimal amount = ledgerService.money(request.amount());
        Payee payee = resolvePayee(user, request);

        Account lookedUp = accountRepository.findByAccountNumber(payee.accountNumber()).orElse(null);
        if (lookedUp != null && lookedUp.getUser().getId().equals(user.getId())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "That is one of your own accounts. Use the Own account tab.");
        }

        Account from;
        Account destination = null;
        if (lookedUp == null) {
            from = accountService.lockOwned(request.fromAccountId(), user.getId());
        } else {
            long low = Math.min(request.fromAccountId(), lookedUp.getId());
            long high = Math.max(request.fromAccountId(), lookedUp.getId());
            Account first = accountRepository.lockById(low)
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Account not found"));
            Account second = accountRepository.lockById(high)
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Account not found"));
            from = request.fromAccountId().equals(first.getId()) ? first : second;
            destination = lookedUp.getId().equals(first.getId()) ? first : second;
            if (!from.getUser().getId().equals(user.getId()) || from.getStatus() != AccountStatus.ACTIVE) {
                throw new ApiException(HttpStatus.NOT_FOUND, "Account not found");
            }
            if (destination.getStatus() != AccountStatus.ACTIVE) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "The recipient account is not active");
            }
        }

        if (from.getAccountNumber().equals(payee.accountNumber())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Choose a different account");
        }

        String reference = BankSupport.reference();
        String remarks = BankSupport.remarks(request.remarks());
        BankTransaction debit = ledgerService.post(
                from, TransactionType.TRANSFER_OUT, amount,
                "To " + payee.name(), payee.name(), payee.accountNumber(),
                reference, remarks, "Transfer", null);
        if (destination != null) {
            ledgerService.post(
                    destination, TransactionType.TRANSFER_IN, amount,
                    "From " + user.getFullName(), user.getFullName(), from.getAccountNumber(),
                    reference, remarks, "Transfer", null);
            notificationService.push(destination.getUser(), "Money received",
                    user.getFullName() + " sent you ₹" + amount.toPlainString() + ".",
                    NotificationType.SUCCESS);
        }
        if (request.beneficiaryId() == null && request.saveBeneficiary()) {
            savePayee(user, payee);
        }
        String channel = destination == null ? "NEFT" : "CoreBank";
        notificationService.push(user, "Transfer sent",
                "₹" + amount.toPlainString() + " was sent to " + payee.name() + " via " + channel + ".",
                NotificationType.SUCCESS);
        return accountService.receipt("Transfer successful", debit, from.getAccountNumber(), payee.accountNumber(), payee.name());
    }

    private Payee resolvePayee(User user, Requests.OtherTransfer request) {
        if (request.beneficiaryId() != null) {
            Beneficiary beneficiary = beneficiaryRepository.findByIdAndUserId(request.beneficiaryId(), user.getId())
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Beneficiary not found"));
            return new Payee(beneficiary.getName(), beneficiary.getAccountNumber(), beneficiary.getBankName(), beneficiary.getIfsc());
        }
        String number = request.accountNumber() == null ? "" : request.accountNumber().trim();
        String name = request.accountName() == null ? "" : request.accountName().trim();
        String bank = request.bankName() == null ? "" : request.bankName().trim();
        String ifsc = BankSupport.ifsc(request.ifsc());
        if (!number.matches("\\d{9,18}") || name.length() < 2 || bank.length() < 2 || !ifsc.matches("^[A-Z]{4}0[A-Z0-9]{6}$")) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Enter the recipient account details, or pick a saved beneficiary");
        }
        return new Payee(name, number, bank, ifsc);
    }

    private void savePayee(User user, Payee payee) {
        if (beneficiaryRepository.existsByUserIdAndAccountNumber(user.getId(), payee.accountNumber())) {
            return;
        }
        Beneficiary beneficiary = new Beneficiary();
        beneficiary.setUser(user);
        beneficiary.setName(payee.name());
        beneficiary.setAccountNumber(payee.accountNumber());
        beneficiary.setBankName(payee.bankName());
        beneficiary.setIfsc(payee.ifsc());
        beneficiary.setCreatedAt(LocalDateTime.now());
        beneficiaryRepository.save(beneficiary);
    }

    private record Payee(String name, String accountNumber, String bankName, String ifsc) {
    }
}
