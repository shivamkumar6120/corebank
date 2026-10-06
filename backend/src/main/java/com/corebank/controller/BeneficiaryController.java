package com.corebank.controller;

import com.corebank.dto.Requests;
import com.corebank.dto.Responses;
import com.corebank.service.BeneficiaryService;
import com.corebank.service.CurrentUserService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/beneficiaries")
public class BeneficiaryController {

    private final BeneficiaryService beneficiaryService;
    private final CurrentUserService currentUserService;

    public BeneficiaryController(BeneficiaryService beneficiaryService, CurrentUserService currentUserService) {
        this.beneficiaryService = beneficiaryService;
        this.currentUserService = currentUserService;
    }

    @GetMapping
    public List<Responses.BeneficiaryView> list() {
        return beneficiaryService.list(currentUserService.require());
    }

    @PostMapping
    public Responses.BeneficiaryView create(@Valid @RequestBody Requests.BeneficiaryUpsert request) {
        return beneficiaryService.create(currentUserService.require(), request);
    }

    @PutMapping("/{id}")
    public Responses.BeneficiaryView update(@PathVariable Long id, @Valid @RequestBody Requests.BeneficiaryUpsert request) {
        return beneficiaryService.update(currentUserService.require(), id, request);
    }

    @DeleteMapping("/{id}")
    public Responses.Notice delete(@PathVariable Long id) {
        return beneficiaryService.delete(currentUserService.require(), id);
    }
}
