package com.corebank.service;

import com.corebank.domain.TransactionDirection;
import com.corebank.dto.Responses;
import com.corebank.entity.BankTransaction;
import com.corebank.entity.User;
import com.corebank.repository.TransactionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
public class DashboardService {

    private static final DateTimeFormatter LABEL = DateTimeFormatter.ofPattern("d MMM", Locale.ENGLISH);

    private final AccountService accountService;
    private final TransactionService transactionService;
    private final TransactionRepository transactionRepository;
    private final NotificationService notificationService;

    public DashboardService(
            AccountService accountService,
            TransactionService transactionService,
            TransactionRepository transactionRepository,
            NotificationService notificationService
    ) {
        this.accountService = accountService;
        this.transactionService = transactionService;
        this.transactionRepository = transactionRepository;
        this.notificationService = notificationService;
    }

    @Transactional(readOnly = true)
    public Responses.Dashboard dashboard(User user) {
        List<Responses.AccountView> accounts = accountService.list(user);
        BigDecimal total = accounts.stream().map(Responses.AccountView::balance).reduce(zero(), BigDecimal::add);

        LocalDate today = LocalDate.now();
        LocalDate chartStart = today.minusDays(6);
        LocalDate monthStart = today.withDayOfMonth(1);
        LocalDate queryStart = chartStart.isBefore(monthStart) ? chartStart : monthStart;
        List<BankTransaction> window = transactionRepository
                .findByAccount_User_IdAndCreatedAtGreaterThanEqualOrderByCreatedAtAsc(user.getId(), queryStart.atStartOfDay());

        BigDecimal moneyIn = sum(window, monthStart, TransactionDirection.CREDIT);
        BigDecimal moneyOut = sum(window, monthStart, TransactionDirection.DEBIT);

        List<Responses.ChartPoint> chart = new ArrayList<>();
        for (int i = 0; i < 7; i++) {
            LocalDate day = chartStart.plusDays(i);
            BigDecimal in = window.stream()
                    .filter(txn -> txn.getCreatedAt().toLocalDate().equals(day) && txn.getDirection() == TransactionDirection.CREDIT)
                    .map(BankTransaction::getAmount)
                    .reduce(zero(), BigDecimal::add);
            BigDecimal out = window.stream()
                    .filter(txn -> txn.getCreatedAt().toLocalDate().equals(day) && txn.getDirection() == TransactionDirection.DEBIT)
                    .map(BankTransaction::getAmount)
                    .reduce(zero(), BigDecimal::add);
            chart.add(new Responses.ChartPoint(day.format(LABEL), in, out));
        }

        Responses.PageResult<Responses.TransactionView> recent = transactionService.search(user, null, null, null, null, null, 0, 6);
        return new Responses.Dashboard(
                user.getFullName(),
                total,
                moneyIn,
                moneyOut,
                notificationService.unread(user).count(),
                accounts,
                recent.content(),
                chart
        );
    }

    private BigDecimal sum(List<BankTransaction> txns, LocalDate from, TransactionDirection direction) {
        return txns.stream()
                .filter(txn -> !txn.getCreatedAt().toLocalDate().isBefore(from) && txn.getDirection() == direction)
                .map(BankTransaction::getAmount)
                .reduce(zero(), BigDecimal::add);
    }

    private BigDecimal zero() {
        return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
    }
}
