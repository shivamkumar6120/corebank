package com.corebank.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 80)
    private String fullName;

    @Column(nullable = false, unique = true, length = 120)
    private String email;

    @Column(nullable = false, unique = true, length = 15)
    private String phone;

    @JsonIgnore
    @Column(nullable = false, length = 80)
    private String passwordHash;

    @JsonIgnore
    @Column(length = 80)
    private String transactionPinHash;

    @Column(length = 240)
    private String address;

    private LocalDate dateOfBirth;

    @Column(nullable = false)
    private boolean enabled = true;

    @Column(name = "is_admin", nullable = false)
    private boolean admin = false;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
