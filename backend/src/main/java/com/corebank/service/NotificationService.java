package com.corebank.service;

import com.corebank.domain.NotificationType;
import com.corebank.dto.Mappers;
import com.corebank.dto.Responses;
import com.corebank.entity.Notification;
import com.corebank.entity.User;
import com.corebank.exception.ApiException;
import com.corebank.repository.NotificationRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    @Transactional
    public void push(User user, String title, String message, NotificationType type) {
        push(user, title, message, type, LocalDateTime.now(), false);
    }

    @Transactional
    public void push(User user, String title, String message, NotificationType type, LocalDateTime when, boolean seen) {
        Notification notification = new Notification();
        notification.setUser(user);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setType(type);
        notification.setSeen(seen);
        notification.setCreatedAt(when == null ? LocalDateTime.now() : when);
        notificationRepository.save(notification);
    }

    @Transactional(readOnly = true)
    public List<Responses.NotificationView> list(User user) {
        return notificationRepository.findTop100ByUserIdOrderByCreatedAtDesc(user.getId()).stream()
                .map(Mappers::notification)
                .toList();
    }

    @Transactional(readOnly = true)
    public Responses.UnreadCount unread(User user) {
        return new Responses.UnreadCount(notificationRepository.countByUserIdAndSeenFalse(user.getId()));
    }

    @Transactional
    public Responses.Notice markRead(User user, Long id) {
        Notification notification = notificationRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Notification not found"));
        notification.setSeen(true);
        notificationRepository.save(notification);
        return new Responses.Notice("Marked as read");
    }

    @Transactional
    public Responses.Notice markAll(User user) {
        notificationRepository.markAllSeen(user.getId());
        return new Responses.Notice("All notifications marked as read");
    }
}
