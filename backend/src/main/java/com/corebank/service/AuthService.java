package com.corebank.service;

import com.corebank.config.AppProperties;
import com.corebank.domain.AccountType;
import com.corebank.domain.NotificationType;
import com.corebank.domain.OtpPurpose;
import com.corebank.dto.Mappers;
import com.corebank.dto.Requests;
import com.corebank.dto.Responses;
import com.corebank.entity.OtpChallenge;
import com.corebank.entity.User;
import com.corebank.exception.ApiException;
import com.corebank.repository.UserRepository;
import com.corebank.security.JwtService;
import com.corebank.util.BankSupport;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final OtpService otpService;
    private final AccountService accountService;
    private final NotificationService notificationService;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final ObjectMapper objectMapper;
    private final AppProperties props;

    public AuthService(
            UserRepository userRepository,
            OtpService otpService,
            AccountService accountService,
            NotificationService notificationService,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            ObjectMapper objectMapper,
            AppProperties props
    ) {
        this.userRepository = userRepository;
        this.otpService = otpService;
        this.accountService = accountService;
        this.notificationService = notificationService;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.objectMapper = objectMapper;
        this.props = props;
    }

    @Transactional
    public Responses.OtpIssued register(Requests.Register request) {
        String email = BankSupport.email(request.email());
        BankSupport.password(request.password());
        BankSupport.adult(request.dateOfBirth());
        if (userRepository.existsByEmail(email)) {
            throw new ApiException(HttpStatus.CONFLICT, "An account with this email already exists");
        }
        if (userRepository.existsByPhone(request.phone().trim())) {
            throw new ApiException(HttpStatus.CONFLICT, "An account with this mobile number already exists");
        }
        try {
            PendingRegistration pending = new PendingRegistration(
                    request.fullName().trim(),
                    email,
                    request.phone().trim(),
                    passwordEncoder.encode(request.password()),
                    passwordEncoder.encode(request.transactionPin()),
                    request.dateOfBirth(),
                    blankToNull(request.address())
            );
            String otp = otpService.issue(email, OtpPurpose.REGISTER, objectMapper.writeValueAsString(pending));
            return issued("We sent a verification code to continue registration.", email, OtpPurpose.REGISTER, otp);
        } catch (ApiException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not start registration");
        }
    }

    @Transactional
    public Responses.OtpIssued login(Requests.Login request) {
        String email = BankSupport.email(request.email());
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid email or password"));
        if (!user.isEnabled() || !passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }
        String otp = otpService.issue(email, OtpPurpose.LOGIN, null);
        return issued("Enter the verification code to sign in.", email, OtpPurpose.LOGIN, otp);
    }

    @Transactional
    public Responses.AuthResult verify(Requests.VerifyOtp request) {
        String email = BankSupport.email(request.email());
        if (request.purpose() == OtpPurpose.RESET_PASSWORD) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Use the reset password step for this code");
        }
        OtpChallenge challenge = otpService.consume(email, request.otp(), request.purpose());
        User user = request.purpose() == OtpPurpose.REGISTER
                ? completeRegistration(challenge)
                : userRepository.findByEmail(email).orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Account not found"));
        return new Responses.AuthResult(jwtService.generate(user), Mappers.user(user));
    }

    @Transactional
    public Responses.OtpIssued resend(Requests.ResendOtp request) {
        String email = BankSupport.email(request.email());
        if (request.purpose() == OtpPurpose.RESET_PASSWORD) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Request a new code from the forgot password page");
        }
        String otp = otpService.resend(email, request.purpose());
        return issued("A new verification code is ready.", email, request.purpose(), otp);
    }

    @Transactional
    public Responses.OtpIssued forgot(Requests.Forgot request) {
        String email = BankSupport.email(request.email());
        if (userRepository.findByEmail(email).isEmpty()) {
            throw new ApiException(HttpStatus.NOT_FOUND, "We could not find an account with that email");
        }
        String otp = otpService.issue(email, OtpPurpose.RESET_PASSWORD, null);
        return issued("Enter the code to reset your password.", email, OtpPurpose.RESET_PASSWORD, otp);
    }

    @Transactional
    public Responses.Notice reset(Requests.ResetPassword request) {
        String email = BankSupport.email(request.email());
        BankSupport.password(request.newPassword());
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "We could not find an account with that email"));
        if (passwordEncoder.matches(request.newPassword(), user.getPasswordHash())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Choose a password you have not used before");
        }
        otpService.consume(email, request.otp(), OtpPurpose.RESET_PASSWORD);
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
        notificationService.push(user, "Password changed", "Your CoreBank password was just updated.", NotificationType.ALERT);
        return new Responses.Notice("Password updated. You can sign in with the new password.");
    }

    private User completeRegistration(OtpChallenge challenge) {
        try {
            PendingRegistration pending = objectMapper.readValue(challenge.getMetadata(), PendingRegistration.class);
            if (userRepository.existsByEmail(pending.email()) || userRepository.existsByPhone(pending.phone())) {
                throw new ApiException(HttpStatus.CONFLICT, "An account with these details already exists");
            }
            User user = new User();
            user.setFullName(pending.fullName());
            user.setEmail(pending.email());
            user.setPhone(pending.phone());
            user.setPasswordHash(pending.passwordHash());
            user.setTransactionPinHash(pending.transactionPinHash());
            user.setDateOfBirth(pending.dateOfBirth());
            user.setAddress(pending.address());
            user.setEnabled(true);
            user.setCreatedAt(LocalDateTime.now());
            user = userRepository.save(user);
            accountService.open(user, AccountType.SAVINGS);
            accountService.open(user, AccountType.CURRENT);
            notificationService.push(user, "Welcome to CoreBank",
                    "Your Savings and Current accounts are ready. Add money to get started.",
                    NotificationType.SUCCESS);
            return user;
        } catch (ApiException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Registration details could not be confirmed. Please register again.");
        }
    }

    private Responses.OtpIssued issued(String message, String email, OtpPurpose purpose, String otp) {
        return new Responses.OtpIssued(message, email, purpose.name(), otp, props.getOtpExpiryMinutes() * 60);
    }

    private String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    public record PendingRegistration(
            String fullName,
            String email,
            String phone,
            String passwordHash,
            String transactionPinHash,
            LocalDate dateOfBirth,
            String address
    ) {
    }
}
