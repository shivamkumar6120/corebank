package com.corebank.service;

import com.corebank.dto.Mappers;
import com.corebank.dto.Requests;
import com.corebank.dto.Responses;
import com.corebank.entity.Beneficiary;
import com.corebank.entity.User;
import com.corebank.exception.ApiException;
import com.corebank.repository.AccountRepository;
import com.corebank.repository.BeneficiaryRepository;
import com.corebank.util.BankSupport;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class BeneficiaryService {

    private final BeneficiaryRepository beneficiaryRepository;
    private final AccountRepository accountRepository;

    public BeneficiaryService(BeneficiaryRepository beneficiaryRepository, AccountRepository accountRepository) {
        this.beneficiaryRepository = beneficiaryRepository;
        this.accountRepository = accountRepository;
    }

    @Transactional(readOnly = true)
    public List<Responses.BeneficiaryView> list(User user) {
        return beneficiaryRepository.findByUserIdOrderByCreatedAtDesc(user.getId()).stream()
                .map(Mappers::beneficiary)
                .toList();
    }

    @Transactional
    public Responses.BeneficiaryView create(User user, Requests.BeneficiaryUpsert request) {
        String number = request.accountNumber().trim();
        ensureNotOwn(user, number);
        if (beneficiaryRepository.existsByUserIdAndAccountNumber(user.getId(), number)) {
            throw new ApiException(HttpStatus.CONFLICT, "This beneficiary is already saved");
        }
        Beneficiary beneficiary = new Beneficiary();
        beneficiary.setUser(user);
        apply(beneficiary, request, number);
        beneficiary.setCreatedAt(LocalDateTime.now());
        return Mappers.beneficiary(beneficiaryRepository.save(beneficiary));
    }

    @Transactional
    public Responses.BeneficiaryView update(User user, Long id, Requests.BeneficiaryUpsert request) {
        Beneficiary beneficiary = beneficiaryRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Beneficiary not found"));
        String number = request.accountNumber().trim();
        ensureNotOwn(user, number);
        beneficiaryRepository.findByUserIdAndAccountNumber(user.getId(), number)
                .filter(existing -> !existing.getId().equals(id))
                .ifPresent(existing -> {
                    throw new ApiException(HttpStatus.CONFLICT, "This beneficiary is already saved");
                });
        apply(beneficiary, request, number);
        return Mappers.beneficiary(beneficiaryRepository.save(beneficiary));
    }

    @Transactional
    public Responses.Notice delete(User user, Long id) {
        Beneficiary beneficiary = beneficiaryRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Beneficiary not found"));
        beneficiaryRepository.delete(beneficiary);
        return new Responses.Notice("Beneficiary removed");
    }

    private void apply(Beneficiary beneficiary, Requests.BeneficiaryUpsert request, String number) {
        beneficiary.setName(request.name().trim());
        beneficiary.setNickname(blankToNull(request.nickname()));
        beneficiary.setAccountNumber(number);
        beneficiary.setBankName(request.bankName().trim());
        beneficiary.setIfsc(BankSupport.ifsc(request.ifsc()));
    }

    private void ensureNotOwn(User user, String number) {
        accountRepository.findByAccountNumber(number).ifPresent(account -> {
            if (account.getUser().getId().equals(user.getId())) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "You do not need to save your own account as a beneficiary");
            }
        });
    }

    private String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
