package com.corebank.controller;

import com.corebank.dto.Requests;
import com.corebank.dto.Responses;
import com.corebank.service.AccountService;
import com.corebank.service.CurrentUserService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/accounts")
public class AccountController {

    private final AccountService accountService;
    private final CurrentUserService currentUserService;

    public AccountController(AccountService accountService, CurrentUserService currentUserService) {
        this.accountService = accountService;
        this.currentUserService = currentUserService;
    }

    @GetMapping
    public List<Responses.AccountView> list() {
        return accountService.list(currentUserService.require());
    }

    @GetMapping("/{id}")
    public Responses.AccountView get(@PathVariable Long id) {
        return accountService.get(currentUserService.require(), id);
    }

    @PostMapping("/deposit")
    public Responses.Receipt deposit(@Valid @RequestBody Requests.Deposit request) {
        return accountService.deposit(currentUserService.require(), request);
    }

    @PostMapping("/withdraw")
    public Responses.Receipt withdraw(@Valid @RequestBody Requests.Withdraw request) {
        return accountService.withdraw(currentUserService.require(), request);
    }
}
