package com.corebank.util;

import com.corebank.exception.ApiException;
import org.springframework.http.HttpStatus;

import java.time.LocalDate;
import java.util.UUID;

public final class BankSupport {

    private BankSupport() {
    }

    public static String email(String value) {
        return value == null ? "" : value.trim().toLowerCase();
    }

    public static String reference() {
        String random = UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();
        return "CB" + java.time.LocalDate.now().format(java.time.format.DateTimeFormatter.BASIC_ISO_DATE) + random;
    }

    public static String remarks(String raw) {
        if (raw == null) {
            return null;
        }
        String trimmed = raw.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    public static String ifsc(String raw) {
        return raw == null ? "" : raw.trim().toUpperCase();
    }

    public static void password(String password) {
        if (password == null
                || password.length() < 8
                || password.length() > 64
                || password.chars().noneMatch(Character::isUpperCase)
                || password.chars().noneMatch(Character::isLowerCase)
                || password.chars().noneMatch(Character::isDigit)) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Password must be at least 8 characters and include an uppercase letter, a lowercase letter, and a number");
        }
    }

    public static void adult(LocalDate dateOfBirth) {
        if (dateOfBirth == null) {
            return;
        }
        if (dateOfBirth.isAfter(LocalDate.now().minusYears(18))) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "You must be at least 18 years old");
        }
    }

    public static String last4(String accountNumber) {
        if (accountNumber == null || accountNumber.length() < 4) {
            return accountNumber;
        }
        return accountNumber.substring(accountNumber.length() - 4);
    }
}
