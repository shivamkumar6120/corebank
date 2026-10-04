package com.corebank.service;

import com.corebank.config.AppProperties;
import com.corebank.domain.OtpPurpose;
import com.corebank.entity.OtpChallenge;
import com.corebank.exception.ApiException;
import com.corebank.repository.OtpRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class OtpService {

    private static final Logger log = LoggerFactory.getLogger(OtpService.class);

    private final OtpRepository otpRepository;
    private final AppProperties props;

    public OtpService(OtpRepository otpRepository, AppProperties props) {
        this.otpRepository = otpRepository;
        this.props = props;
    }

    @Transactional
    public String issue(String email, OtpPurpose purpose, String metadata) {
        String normalised = email.trim().toLowerCase();
        otpRepository.deleteByEmailAndPurpose(normalised, purpose);
        String code = String.valueOf(ThreadLocalRandom.current().nextInt(100_000, 1_000_000));
        OtpChallenge challenge = new OtpChallenge();
        challenge.setEmail(normalised);
        challenge.setCodeHash(sha256(code));
        challenge.setPurpose(purpose);
        challenge.setMetadata(metadata);
        challenge.setExpiresAt(LocalDateTime.now().plusMinutes(props.getOtpExpiryMinutes()));
        challenge.setConsumed(false);
        challenge.setCreatedAt(LocalDateTime.now());
        otpRepository.save(challenge);
        if (props.isOtpDemoMode()) {
            log.info("Simulated OTP for {} [{}]: {}", normalised, purpose, code);
            return code;
        }
        return null;
    }

    @Transactional
    public OtpChallenge consume(String email, String code, OtpPurpose purpose) {
        String normalised = email.trim().toLowerCase();
        OtpChallenge challenge = otpRepository
                .findFirstByEmailAndPurposeAndConsumedFalseOrderByCreatedAtDesc(normalised, purpose)
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "No active verification code. Request a new one."));
        if (challenge.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "That code has expired. Request a new one.");
        }
        String presented = sha256(code == null ? "" : code.trim());
        if (!MessageDigest.isEqual(presented.getBytes(StandardCharsets.UTF_8), challenge.getCodeHash().getBytes(StandardCharsets.UTF_8))) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Incorrect verification code");
        }
        challenge.setConsumed(true);
        return otpRepository.save(challenge);
    }

    @Transactional
    public String resend(String email, OtpPurpose purpose) {
        String normalised = email.trim().toLowerCase();
        OtpChallenge existing = otpRepository
                .findFirstByEmailAndPurposeAndConsumedFalseOrderByCreatedAtDesc(normalised, purpose)
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Request a new code from the previous step."));
        if (existing.getCreatedAt().isAfter(LocalDateTime.now().minusSeconds(30))) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Please wait a few seconds before resending.");
        }
        return issue(normalised, purpose, existing.getMetadata());
    }

    private String sha256(String raw) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(raw.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (Exception ex) {
            throw new IllegalStateException("Unable to hash OTP", ex);
        }
    }
}
