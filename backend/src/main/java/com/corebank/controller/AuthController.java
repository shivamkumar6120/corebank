package com.corebank.controller;

import com.corebank.dto.Requests;
import com.corebank.dto.Responses;
import com.corebank.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public Responses.OtpIssued register(@Valid @RequestBody Requests.Register request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public Responses.OtpIssued login(@Valid @RequestBody Requests.Login request) {
        return authService.login(request);
    }

    @PostMapping("/verify-otp")
    public Responses.AuthResult verify(@Valid @RequestBody Requests.VerifyOtp request) {
        return authService.verify(request);
    }

    @PostMapping("/resend-otp")
    public Responses.OtpIssued resend(@Valid @RequestBody Requests.ResendOtp request) {
        return authService.resend(request);
    }

    @PostMapping("/forgot-password")
    public Responses.OtpIssued forgot(@Valid @RequestBody Requests.Forgot request) {
        return authService.forgot(request);
    }

    @PostMapping("/reset-password")
    public Responses.Notice reset(@Valid @RequestBody Requests.ResetPassword request) {
        return authService.reset(request);
    }
}
