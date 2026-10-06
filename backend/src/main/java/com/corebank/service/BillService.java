package com.corebank.service;

import com.corebank.domain.Biller;
import com.corebank.domain.NotificationType;
import com.corebank.domain.TransactionType;
import com.corebank.dto.Requests;
import com.corebank.dto.Responses;
import com.corebank.entity.Account;
import com.corebank.entity.BankTransaction;
import com.corebank.entity.User;
import com.corebank.exception.ApiException;
import com.corebank.util.BankSupport;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;

@Service
public class BillService {

    private static final List<String> OPERATORS = List.of("Jio", "Airtel", "Vi", "BSNL");
    private static final List<Integer> PLANS = List.of(99, 149, 199, 299, 399, 599, 999);

    private final AccountService accountService;
    private final LedgerService ledgerService;
    private final NotificationService notificationService;

    public BillService(AccountService accountService, LedgerService ledgerService, NotificationService notificationService) {
        this.accountService = accountService;
        this.ledgerService = ledgerService;
        this.notificationService = notificationService;
    }

    public Responses.Catalog catalog() {
        List<Responses.BillerView> billers = Arrays.stream(Biller.values())
                .map(biller -> new Responses.BillerView(biller.name(), biller.getCategory(), biller.getDisplayName()))
                .toList();
        return new Responses.Catalog(billers, OPERATORS, PLANS);
    }

    @Transactional
    public Responses.Receipt pay(User user, Requests.BillPay request) {
        accountService.verifyPin(user, request.pin());
        Biller biller = Biller.fromCode(request.billerCode());
        if (biller == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Choose a biller");
        }
        var amount = ledgerService.money(request.amount());
        Account account = accountService.lockOwned(request.accountId(), user.getId());
        String consumer = request.consumerNumber().trim();
        BankTransaction txn = ledgerService.post(
                account,
                TransactionType.BILL_PAYMENT,
                amount,
                biller.getDisplayName() + " · " + consumer,
                biller.getDisplayName(),
                consumer,
                BankSupport.reference(),
                null,
                "Bills",
                null
        );
        notificationService.push(user, "Bill paid",
                biller.getDisplayName() + " bill of ₹" + amount.toPlainString() + " was paid.",
                NotificationType.SUCCESS);
        return accountService.receipt("Bill paid", txn, account.getAccountNumber(), consumer, biller.getDisplayName());
    }

    @Transactional
    public Responses.Receipt recharge(User user, Requests.Recharge request) {
        accountService.verifyPin(user, request.pin());
        String operator = OPERATORS.stream()
                .filter(item -> item.equalsIgnoreCase(request.operator().trim()))
                .findFirst()
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Choose a mobile operator"));
        var amount = ledgerService.money(request.amount());
        Account account = accountService.lockOwned(request.accountId(), user.getId());
        String mobile = request.mobile().trim();
        BankTransaction txn = ledgerService.post(
                account,
                TransactionType.MOBILE_RECHARGE,
                amount,
                operator + " prepaid · " + mobile,
                operator,
                mobile,
                BankSupport.reference(),
                null,
                "Recharge",
                null
        );
        notificationService.push(user, "Recharge successful",
                operator + " recharge of ₹" + amount.toPlainString() + " for " + mobile + " is done.",
                NotificationType.SUCCESS);
        return accountService.receipt("Recharge successful", txn, account.getAccountNumber(), mobile, operator);
    }
}
