package com.corebank.controller;

import com.corebank.dto.Responses;
import com.corebank.service.CurrentUserService;
import com.corebank.service.StatementService;
import com.corebank.service.TransactionService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
public class TransactionController {

    private final TransactionService transactionService;
    private final StatementService statementService;
    private final CurrentUserService currentUserService;

    public TransactionController(
            TransactionService transactionService,
            StatementService statementService,
            CurrentUserService currentUserService
    ) {
        this.transactionService = transactionService;
        this.statementService = statementService;
        this.currentUserService = currentUserService;
    }

    @GetMapping("/api/transactions")
    public Responses.PageResult<Responses.TransactionView> list(
            @RequestParam(required = false) Long accountId,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return transactionService.search(currentUserService.require(), accountId, type, from, to, q, page, size);
    }

    @GetMapping("/api/statements/mini")
    public List<Responses.TransactionView> mini(@RequestParam Long accountId) {
        return transactionService.mini(currentUserService.require(), accountId);
    }

    @GetMapping("/api/statements")
    public Responses.StatementView statement(
            @RequestParam Long accountId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        return transactionService.statement(currentUserService.require(), accountId, from, to);
    }

    @GetMapping("/api/statements/pdf")
    public ResponseEntity<byte[]> pdf(
            @RequestParam Long accountId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        var user = currentUserService.require();
        byte[] body = statementService.pdf(user, accountId, from, to);
        String filename = "CoreBank-Statement-" + accountId + ".pdf";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(body);
    }
}
