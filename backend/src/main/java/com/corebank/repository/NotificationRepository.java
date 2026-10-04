package com.corebank.repository;

import com.corebank.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findTop100ByUserIdOrderByCreatedAtDesc(Long userId);

    long countByUserIdAndSeenFalse(Long userId);

    Optional<Notification> findByIdAndUserId(Long id, Long userId);

    @Modifying
    @Query("update Notification n set n.seen = true where n.user.id = :userId and n.seen = false")
    int markAllSeen(@Param("userId") Long userId);
}
