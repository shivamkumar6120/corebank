package com.corebank.dto;

import com.corebank.entity.Account;
import com.corebank.entity.BankTransaction;
import com.corebank.entity.Beneficiary;
import com.corebank.entity.Notification;
import com.corebank.entity.User;

public final class Mappers {

    private Mappers() {
    }

    public static Responses.UserView user(User user) {
        return new Responses.UserView(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhone(),
                user.getAddress(),
                user.getDateOfBirth(),
                user.getTransactionPinHash() != null,
                user.getCreatedAt()
        );
    }

    public static Responses.AccountView account(Account account) {
        return new Responses.AccountView(
                account.getId(),
                account.getAccountNumber(),
                account.getAccountType().name(),
                account.getBalance(),
                account.getCurrency(),
                account.getStatus().name(),
                account.getIfsc(),
                account.getBranch(),
                account.getCreatedAt()
        );
    }

    public static Responses.TransactionView transaction(BankTransaction txn) {
        return new Responses.TransactionView(
                txn.getId(),
                txn.getAccount().getId(),
                txn.getAccount().getAccountNumber(),
                txn.getType().name(),
                txn.getDirection().name(),
                txn.getAmount(),
                txn.getBalanceAfter(),
                txn.getDescription(),
                txn.getCounterpartyName(),
                txn.getCounterpartyAccount(),
                txn.getReferenceNumber(),
                txn.getRemarks(),
                txn.getCategory(),
                txn.getCreatedAt()
        );
    }

    public static Responses.BeneficiaryView beneficiary(Beneficiary beneficiary) {
        return new Responses.BeneficiaryView(
                beneficiary.getId(),
                beneficiary.getName(),
                beneficiary.getNickname(),
                beneficiary.getAccountNumber(),
                beneficiary.getBankName(),
                beneficiary.getIfsc(),
                beneficiary.getCreatedAt()
        );
    }

    public static Responses.NotificationView notification(Notification notification) {
        return new Responses.NotificationView(
                notification.getId(),
                notification.getTitle(),
                notification.getMessage(),
                notification.getType().name(),
                notification.isSeen(),
                notification.getCreatedAt()
        );
    }
}
