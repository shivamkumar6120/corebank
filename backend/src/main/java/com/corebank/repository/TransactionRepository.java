package com.corebank.repository;

import com.corebank.entity.BankTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface TransactionRepository extends JpaRepository<BankTransaction, Long>, JpaSpecificationExecutor<BankTransaction> {

    List<BankTransaction> findByAccount_User_IdAndCreatedAtGreaterThanEqualOrderByCreatedAtAsc(Long userId, LocalDateTime from);

    List<BankTransaction> findTop10ByAccountIdOrderByCreatedAtDescIdDesc(Long accountId);

    List<BankTransaction> findByAccountIdAndCreatedAtGreaterThanEqualAndCreatedAtLessThanOrderByCreatedAtAscIdAsc(
            Long accountId, LocalDateTime from, LocalDateTime to);

    Optional<BankTransaction> findFirstByAccountIdAndCreatedAtLessThanOrderByCreatedAtDescIdDesc(Long accountId, LocalDateTime from);
}
