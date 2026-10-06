package com.corebank.controller;

import com.corebank.dto.Requests;
import com.corebank.dto.Responses;
import com.corebank.service.BillService;
import com.corebank.service.CurrentUserService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/bills")
public class BillController {

    private final BillService billService;
    private final CurrentUserService currentUserService;

    public BillController(BillService billService, CurrentUserService currentUserService) {
        this.billService = billService;
        this.currentUserService = currentUserService;
    }

    @GetMapping("/catalog")
    public Responses.Catalog catalog() {
        return billService.catalog();
    }

    @PostMapping("/pay")
    public Responses.Receipt pay(@Valid @RequestBody Requests.BillPay request) {
        return billService.pay(currentUserService.require(), request);
    }

    @PostMapping("/recharge")
    public Responses.Receipt recharge(@Valid @RequestBody Requests.Recharge request) {
        return billService.recharge(currentUserService.require(), request);
    }
}
