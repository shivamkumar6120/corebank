package com.corebank.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public final class Responses {

    private Responses() {
    }

    public record UserView(
            Long id,
            String fullName,
            String email,
            String phone,
            String address,
            LocalDate dateOfBirth,
            boolean hasPin,
            LocalDateTime createdAt
    ) {
    }

    public record AccountView(
            Long id,
            String accountNumber,
            String accountType,
            BigDecimal balance,
            String currency,
            String status,
            String ifsc,
            String branch,
            LocalDateTime createdAt
    ) {
    }

    public record TransactionView(
            Long id,
            Long accountId,
            String accountNumber,
            String type,
            String direction,
            BigDecimal amount,
            BigDecimal balanceAfter,
            String description,
            String counterpartyName,
            String counterpartyAccount,
            String referenceNumber,
            String remarks,
            String category,
            LocalDateTime createdAt
    ) {
    }

    public record BeneficiaryView(
            Long id,
            String name,
            String nickname,
            String accountNumber,
            String bankName,
            String ifsc,
            LocalDateTime createdAt
    ) {
    }

    public record NotificationView(
            Long id,
            String title,
            String message,
            String type,
            boolean read,
            LocalDateTime createdAt
    ) {
    }

    public record AuthResult(String token, UserView user) {
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record OtpIssued(String message, String email, String purpose, String demoOtp, int expiresInSeconds) {
    }

    public record Notice(String message) {
    }

    public record PageResult<T>(List<T> content, int page, int size, long totalElements, int totalPages) {
    }

    public record ChartPoint(String label, BigDecimal moneyIn, BigDecimal moneyOut) {
    }

    public record Dashboard(
            String fullName,
            BigDecimal totalBalance,
            BigDecimal moneyInThisMonth,
            BigDecimal moneyOutThisMonth,
            long unreadNotifications,
            List<AccountView> accounts,
            List<TransactionView> recent,
            List<ChartPoint> chart
    ) {
    }

    public record Receipt(
            String referenceNumber,
            BigDecimal amount,
            String title,
            String fromAccount,
            String toAccount,
            String toName,
            BigDecimal balanceAfter,
            LocalDateTime createdAt,
            String remarks
    ) {
    }

    public record StatementView(
            AccountView account,
            LocalDate from,
            LocalDate to,
            BigDecimal openingBalance,
            BigDecimal closingBalance,
            BigDecimal totalDebit,
            BigDecimal totalCredit,
            List<TransactionView> transactions
    ) {
    }

    public record BillerView(String code, String category, String name) {
    }

    public record Catalog(List<BillerView> billers, List<String> operators, List<Integer> rechargePlans) {
    }

    public record UnreadCount(long count) {
    }
}
