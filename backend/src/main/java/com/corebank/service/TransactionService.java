package com.corebank.service;

import com.corebank.domain.TransactionDirection;
import com.corebank.domain.TransactionType;
import com.corebank.dto.Mappers;
import com.corebank.dto.Responses;
import com.corebank.entity.Account;
import com.corebank.entity.BankTransaction;
import com.corebank.entity.User;
import com.corebank.exception.ApiException;
import com.corebank.repository.TransactionRepository;
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
import java.util.List;

@Service
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final AccountService accountService;

    public TransactionService(TransactionRepository transactionRepository, AccountService accountService) {
        this.transactionRepository = transactionRepository;
        this.accountService = accountService;
    }

    @Transactional(readOnly = true)
    public Responses.PageResult<Responses.TransactionView> search(
            User user,
            Long accountId,
            String type,
            LocalDate from,
            LocalDate to,
            String query,
            int page,
            int size
    ) {
        if (accountId != null) {
            accountService.requireOwned(accountId, user.getId());
        }
        if (from != null && to != null && to.isBefore(from)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "The end date must be on or after the start date");
        }
        TransactionType parsed = parseType(type);
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 50);
        LocalDateTime fromTime = from == null ? null : from.atStartOfDay();
        LocalDateTime toTime = to == null ? null : to.plusDays(1).atStartOfDay();
        String needle = query == null || query.isBlank() ? null : query.trim().toLowerCase();

        Page<BankTransaction> result = transactionRepository.findAll((root, cq, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("account").get("user").get("id"), user.getId()));
            if (accountId != null) {
                predicates.add(cb.equal(root.get("account").get("id"), accountId));
            }
            if (parsed != null) {
                predicates.add(cb.equal(root.get("type"), parsed));
            }
            if (fromTime != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), fromTime));
            }
            if (toTime != null) {
                predicates.add(cb.lessThan(root.get("createdAt"), toTime));
            }
            if (needle != null) {
                String like = "%" + needle + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("description")), like),
                        cb.like(cb.lower(root.get("referenceNumber")), like),
                        cb.like(cb.lower(cb.coalesce(root.get("counterpartyName"), "")), like)
                ));
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        }, PageRequest.of(safePage, safeSize, Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id"))));

        List<Responses.TransactionView> content = result.getContent().stream().map(Mappers::transaction).toList();
        return new Responses.PageResult<>(content, result.getNumber(), result.getSize(), result.getTotalElements(), result.getTotalPages());
    }

    @Transactional(readOnly = true)
    public List<Responses.TransactionView> mini(User user, Long accountId) {
        Account account = accountService.requireOwned(accountId, user.getId());
        return transactionRepository.findTop10ByAccountIdOrderByCreatedAtDescIdDesc(account.getId()).stream()
                .map(Mappers::transaction)
                .toList();
    }

    @Transactional(readOnly = true)
    public Responses.StatementView statement(User user, Long accountId, LocalDate from, LocalDate to) {
        if (from == null || to == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Choose a start and end date");
        }
        if (to.isBefore(from)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "The end date must be on or after the start date");
        }
        if (from.plusDays(366).isBefore(to)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Choose a period of one year or less");
        }
        Account account = accountService.requireOwned(accountId, user.getId());
        LocalDateTime fromTime = from.atStartOfDay();
        LocalDateTime toTime = to.plusDays(1).atStartOfDay();
        List<BankTransaction> txns = transactionRepository
                .findByAccountIdAndCreatedAtGreaterThanEqualAndCreatedAtLessThanOrderByCreatedAtAscIdAsc(account.getId(), fromTime, toTime);
        BigDecimal opening = transactionRepository
                .findFirstByAccountIdAndCreatedAtLessThanOrderByCreatedAtDescIdDesc(account.getId(), fromTime)
                .map(BankTransaction::getBalanceAfter)
                .orElse(zero());
        BigDecimal closing = txns.isEmpty() ? opening : txns.get(txns.size() - 1).getBalanceAfter();
        BigDecimal debit = txns.stream()
                .filter(txn -> txn.getDirection() == TransactionDirection.DEBIT)
                .map(BankTransaction::getAmount)
                .reduce(zero(), BigDecimal::add);
        BigDecimal credit = txns.stream()
                .filter(txn -> txn.getDirection() == TransactionDirection.CREDIT)
                .map(BankTransaction::getAmount)
                .reduce(zero(), BigDecimal::add);
        return new Responses.StatementView(
                Mappers.account(account),
                from,
                to,
                opening,
                closing,
                debit,
                credit,
                txns.stream().map(Mappers::transaction).toList()
        );
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

    private BigDecimal zero() {
        return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
    }
}
