package com.corebank.dto;

import com.corebank.domain.OtpPurpose;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public final class Requests {

    private Requests() {
    }

    public record Login(
            @NotBlank @Email String email,
            @NotBlank String password
    ) {
    }

    public record Register(
            @NotBlank @Size(min = 2, max = 80) String fullName,
            @NotBlank @Email @Size(max = 120) String email,
            @NotBlank @Pattern(regexp = "^[6-9]\\d{9}$", message = "Enter a valid 10-digit Indian mobile number") String phone,
            @NotBlank @Size(min = 8, max = 64) String password,
            @NotBlank @Pattern(regexp = "\\d{4}", message = "PIN must be 4 digits") String transactionPin,
            LocalDate dateOfBirth,
            @Size(max = 240) String address
    ) {
    }

    public record VerifyOtp(
            @NotBlank @Email String email,
            @NotBlank @Pattern(regexp = "\\d{6}", message = "Enter the 6-digit code") String otp,
            @NotNull OtpPurpose purpose
    ) {
    }

    public record ResendOtp(
            @NotBlank @Email String email,
            @NotNull OtpPurpose purpose
    ) {
    }

    public record Forgot(@NotBlank @Email String email) {
    }

    public record ResetPassword(
            @NotBlank @Email String email,
            @NotBlank @Pattern(regexp = "\\d{6}", message = "Enter the 6-digit code") String otp,
            @NotBlank @Size(min = 8, max = 64) String newPassword
    ) {
    }

    public record Deposit(
            @NotNull Long accountId,
            @NotNull @DecimalMin(value = "1.00", message = "Amount must be at least 1") @Digits(integer = 10, fraction = 2) BigDecimal amount,
            @NotBlank String method,
            @Size(max = 120) String remarks
    ) {
    }

    public record Withdraw(
            @NotNull Long accountId,
            @NotNull @DecimalMin(value = "1.00", message = "Amount must be at least 1") @Digits(integer = 10, fraction = 2) BigDecimal amount,
            @NotBlank @Pattern(regexp = "\\d{4}", message = "Enter your 4-digit PIN") String pin,
            @Size(max = 120) String remarks
    ) {
    }

    public record OwnTransfer(
            @NotNull Long fromAccountId,
            @NotNull Long toAccountId,
            @NotNull @DecimalMin(value = "1.00", message = "Amount must be at least 1") @Digits(integer = 10, fraction = 2) BigDecimal amount,
            @NotBlank @Pattern(regexp = "\\d{4}", message = "Enter your 4-digit PIN") String pin,
            @Size(max = 120) String remarks
    ) {
    }

    public record OtherTransfer(
            @NotNull Long fromAccountId,
            Long beneficiaryId,
            @Size(max = 18) String accountNumber,
            @Size(max = 80) String accountName,
            @Size(max = 60) String bankName,
            @Size(max = 11) String ifsc,
            boolean saveBeneficiary,
            @NotNull @DecimalMin(value = "1.00", message = "Amount must be at least 1") @Digits(integer = 10, fraction = 2) BigDecimal amount,
            @NotBlank @Pattern(regexp = "\\d{4}", message = "Enter your 4-digit PIN") String pin,
            @Size(max = 120) String remarks
    ) {
    }

    public record BeneficiaryUpsert(
            @NotBlank @Size(max = 80) String name,
            @NotBlank @Pattern(regexp = "\\d{9,18}", message = "Account number should be 9 to 18 digits") String accountNumber,
            @NotBlank @Size(max = 60) String bankName,
            @NotBlank @Pattern(regexp = "^[A-Za-z]{4}0[A-Za-z0-9]{6}$", message = "Enter a valid IFSC") String ifsc,
            @Size(max = 40) String nickname
    ) {
    }

    public record BillPay(
            @NotNull Long accountId,
            @NotBlank String billerCode,
            @NotBlank @Size(min = 5, max = 20) String consumerNumber,
            @NotNull @DecimalMin(value = "1.00", message = "Amount must be at least 1") @Digits(integer = 10, fraction = 2) BigDecimal amount,
            @NotBlank @Pattern(regexp = "\\d{4}", message = "Enter your 4-digit PIN") String pin
    ) {
    }

    public record Recharge(
            @NotNull Long accountId,
            @NotBlank String operator,
            @NotBlank @Pattern(regexp = "^[6-9]\\d{9}$", message = "Enter a valid mobile number") String mobile,
            @NotNull @DecimalMin(value = "1.00", message = "Amount must be at least 1") @Digits(integer = 10, fraction = 2) BigDecimal amount,
            @NotBlank @Pattern(regexp = "\\d{4}", message = "Enter your 4-digit PIN") String pin
    ) {
    }

    public record ProfileUpdate(
            @NotBlank @Size(min = 2, max = 80) String fullName,
            @NotBlank @Pattern(regexp = "^[6-9]\\d{9}$", message = "Enter a valid 10-digit Indian mobile number") String phone,
            @Size(max = 240) String address,
            LocalDate dateOfBirth
    ) {
    }

    public record PasswordChange(
            @NotBlank String currentPassword,
            @NotBlank @Size(min = 8, max = 64) String newPassword
    ) {
    }

    public record PinChange(
            @NotBlank String password,
            @Size(max = 4) String currentPin,
            @NotBlank @Pattern(regexp = "\\d{4}", message = "PIN must be 4 digits") String newPin
    ) {
    }
}
