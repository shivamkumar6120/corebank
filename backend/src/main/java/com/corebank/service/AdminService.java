package com.corebank.service;

import com.corebank.domain.TransactionType;
import com.corebank.dto.Responses;
import com.corebank.entity.Account;
import com.corebank.entity.BankTransaction;
import com.corebank.entity.User;
import com.corebank.exception.ApiException;
import com.corebank.repository.AccountRepository;
import com.corebank.repository.TransactionRepository;
import com.corebank.repository.UserRepository;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AdminService {

    private final UserRepository userRepository;
    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;
    private final CurrentUserService currentUserService;

    public AdminService(
            UserRepository userRepository,
            AccountRepository accountRepository,
            TransactionRepository transactionRepository,
            CurrentUserService currentUserService
    ) {
        this.userRepository = userRepository;
        this.accountRepository = accountRepository;
        this.transactionRepository = transactionRepository;
        this.currentUserService = currentUserService;
    }

    @Transactional(readOnly = true)
    public Responses.AdminStats stats() {
        requireAdmin();
        BigDecimal volume = transactionRepository.sumAmounts();
        if (volume == null) {
            volume = BigDecimal.ZERO;
        }
        List<Responses.AdminTransaction> recent = transactionRepository.findAll(
                PageRequest.of(0, 10, Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id")))
        ).getContent().stream().map(this::view).toList();
        return new Responses.AdminStats(
                userRepository.count(),
                accountRepository.count(),
                volume.setScale(2, RoundingMode.HALF_UP),
                recent
        );
    }

    @Transactional(readOnly = true)
    public List<Responses.AdminUser> users() {
        requireAdmin();
        Map<Long, List<Account>> accounts = accountRepository.findAll().stream()
                .collect(Collectors.groupingBy(account -> account.getUser().getId()));
        return userRepository.findAll(Sort.by("fullName")).stream()
                .map(user -> new Responses.AdminUser(
                        user.getId(),
                        user.getFullName(),
                        user.getEmail(),
                        accounts.getOrDefault(user.getId(), List.of()).stream()
                                .sorted(Comparator.comparing(Account::getId))
                                .map(account -> new Responses.AdminAccount(
                                        account.getAccountNumber(),
                                        account.getAccountType().name(),
                                        account.getBalance()
                                ))
                                .toList()
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public Responses.PageResult<Responses.AdminTransaction> transactions(
            String type,
            LocalDate from,
            LocalDate to,
            BigDecimal minAmount,
            BigDecimal maxAmount,
            int page,
            int size
    ) {
        requireAdmin();
        if (from != null && to != null && to.isBefore(from)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "The end date must be on or after the start date");
        }
        if (minAmount != null && maxAmount != null && maxAmount.compareTo(minAmount) < 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "The maximum amount must be at least the minimum");
        }
        TransactionType parsed = parseType(type);
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 50);
        LocalDateTime fromTime = from == null ? null : from.atStartOfDay();
        LocalDateTime toTime = to == null ? null : to.plusDays(1).atStartOfDay();

        Page<BankTransaction> result = transactionRepository.findAll((root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (parsed != null) {
                predicates.add(cb.equal(root.get("type"), parsed));
            }
            if (fromTime != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), fromTime));
            }
            if (toTime != null) {
                predicates.add(cb.lessThan(root.get("createdAt"), toTime));
            }
            if (minAmount != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("amount"), minAmount));
            }
            if (maxAmount != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("amount"), maxAmount));
            }
            if (predicates.isEmpty()) {
                return cb.conjunction();
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        }, PageRequest.of(safePage, safeSize, Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id"))));

        return new Responses.PageResult<>(
                result.getContent().stream().map(this::view).toList(),
                result.getNumber(),
                result.getSize(),
                result.getTotalElements(),
                result.getTotalPages()
        );
    }

    private Responses.AdminTransaction view(BankTransaction txn) {
        Account account = txn.getAccount();
        User owner = account.getUser();
        return new Responses.AdminTransaction(
                txn.getId(),
                owner.getFullName(),
                owner.getEmail(),
                account.getAccountNumber(),
                txn.getType().name(),
                txn.getDirection().name(),
                txn.getAmount(),
                txn.getDescription(),
                txn.getReferenceNumber(),
                txn.getCreatedAt()
        );
    }

    private void requireAdmin() {
        if (!currentUserService.require().isAdmin()) {
            throw new ApiException(HttpStatus.FORBIDDEN, "You do not have access to this");
        }
    }

    private TransactionType parseType(String type) {
        if (type == null || type.isBlank() || "ALL".equalsIgnoreCase(type)) {
            return null;
        }
        try {
            return TransactionType.valueOf(type.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Unknown transaction type");
        }
    }
}
