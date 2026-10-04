package com.corebank.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(
        name = "beneficiaries",
        uniqueConstraints = @UniqueConstraint(name = "uk_beneficiary_user_account", columnNames = {"user_id", "account_number"})
)
public class Beneficiary {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 80)
    private String name;

    @Column(length = 40)
    private String nickname;

    @Column(nullable = false, length = 18)
    private String accountNumber;

    @Column(nullable = false, length = 60)
    private String bankName;

    @Column(nullable = false, length = 11)
    private String ifsc;

    @Column(nullable = false)
    private LocalDateTime createdAt;
}
