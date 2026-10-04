package com.corebank.controller;

import com.corebank.dto.Requests;
import com.corebank.dto.Responses;
import com.corebank.service.CurrentUserService;
import com.corebank.service.TransferService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/transfers")
public class TransferController {

    private final TransferService transferService;
    private final CurrentUserService currentUserService;

    public TransferController(TransferService transferService, CurrentUserService currentUserService) {
        this.transferService = transferService;
        this.currentUserService = currentUserService;
    }

    @PostMapping("/own")
    public Responses.Receipt own(@Valid @RequestBody Requests.OwnTransfer request) {
        return transferService.own(currentUserService.require(), request);
    }

    @PostMapping("/other")
    public Responses.Receipt other(@Valid @RequestBody Requests.OtherTransfer request) {
        return transferService.other(currentUserService.require(), request);
    }
}
