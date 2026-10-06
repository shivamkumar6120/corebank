package com.corebank.controller;

import com.corebank.dto.Requests;
import com.corebank.dto.Responses;
import com.corebank.service.CurrentUserService;
import com.corebank.service.ProfileService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    private final ProfileService profileService;
    private final CurrentUserService currentUserService;

    public ProfileController(ProfileService profileService, CurrentUserService currentUserService) {
        this.profileService = profileService;
        this.currentUserService = currentUserService;
    }

    @GetMapping
    public Responses.UserView me() {
        return profileService.view(currentUserService.require());
    }

    @PutMapping
    public Responses.UserView update(@Valid @RequestBody Requests.ProfileUpdate request) {
        return profileService.update(currentUserService.require(), request);
    }

    @PutMapping("/password")
    public Responses.Notice password(@Valid @RequestBody Requests.PasswordChange request) {
        return profileService.changePassword(currentUserService.require(), request);
    }

    @PutMapping("/pin")
    public Responses.Notice pin(@Valid @RequestBody Requests.PinChange request) {
        return profileService.changePin(currentUserService.require(), request);
    }
}
