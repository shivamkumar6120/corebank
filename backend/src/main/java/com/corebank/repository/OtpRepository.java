package com.corebank.repository;

import com.corebank.domain.OtpPurpose;
import com.corebank.entity.OtpChallenge;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface OtpRepository extends JpaRepository<OtpChallenge, Long> {

    void deleteByEmailAndPurpose(String email, OtpPurpose purpose);

    Optional<OtpChallenge> findFirstByEmailAndPurposeAndConsumedFalseOrderByCreatedAtDesc(String email, OtpPurpose purpose);
}
