package com.corebank.service;

import com.corebank.domain.NotificationType;
import com.corebank.dto.Mappers;
import com.corebank.dto.Requests;
import com.corebank.dto.Responses;
import com.corebank.entity.User;
import com.corebank.exception.ApiException;
import com.corebank.repository.UserRepository;
import com.corebank.util.BankSupport;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class ProfileService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final NotificationService notificationService;

    public ProfileService(UserRepository userRepository, PasswordEncoder passwordEncoder, NotificationService notificationService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.notificationService = notificationService;
    }

    public Responses.UserView view(User user) {
        return Mappers.user(user);
    }

    @Transactional
    public Responses.UserView update(User user, Requests.ProfileUpdate request) {
        BankSupport.adult(request.dateOfBirth());
        String phone = request.phone().trim();
        if (userRepository.existsByPhoneAndIdNot(phone, user.getId())) {
            throw new ApiException(HttpStatus.CONFLICT, "That mobile number is already in use");
        }
        user.setFullName(request.fullName().trim());
        user.setPhone(phone);
        user.setAddress(request.address() == null || request.address().isBlank() ? null : request.address().trim());
        user.setDateOfBirth(request.dateOfBirth());
        user.setUpdatedAt(LocalDateTime.now());
        return Mappers.user(userRepository.save(user));
    }

    @Transactional
    public Responses.Notice changePassword(User user, Requests.PasswordChange request) {
        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Current password is incorrect");
        }
        BankSupport.password(request.newPassword());
        if (passwordEncoder.matches(request.newPassword(), user.getPasswordHash())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Choose a password you have not used before");
        }
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
        notificationService.push(user, "Password changed", "Your CoreBank password was just updated.", NotificationType.ALERT);
        return new Responses.Notice("Password updated");
    }

    @Transactional
    public Responses.Notice changePin(User user, Requests.PinChange request) {
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Password is incorrect");
        }
        if (user.getTransactionPinHash() != null) {
            if (request.currentPin() == null
                    || !request.currentPin().matches("\\d{4}")
                    || !passwordEncoder.matches(request.currentPin(), user.getTransactionPinHash())) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Current PIN is incorrect");
            }
            if (request.currentPin().equals(request.newPin())) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Choose a different PIN");
            }
        }
        user.setTransactionPinHash(passwordEncoder.encode(request.newPin()));
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
        notificationService.push(user, "Transaction PIN changed", "Your transaction PIN was just updated.", NotificationType.ALERT);
        return new Responses.Notice("Transaction PIN updated");
    }
}
