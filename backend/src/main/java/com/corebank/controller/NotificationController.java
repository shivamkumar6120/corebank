package com.corebank.controller;

import com.corebank.dto.Responses;
import com.corebank.service.CurrentUserService;
import com.corebank.service.NotificationService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;
    private final CurrentUserService currentUserService;

    public NotificationController(NotificationService notificationService, CurrentUserService currentUserService) {
        this.notificationService = notificationService;
        this.currentUserService = currentUserService;
    }

    @GetMapping
    public List<Responses.NotificationView> list() {
        return notificationService.list(currentUserService.require());
    }

    @GetMapping("/unread-count")
    public Responses.UnreadCount unread() {
        return notificationService.unread(currentUserService.require());
    }

    @PostMapping("/{id}/read")
    public Responses.Notice read(@PathVariable Long id) {
        return notificationService.markRead(currentUserService.require(), id);
    }

    @PostMapping("/read-all")
    public Responses.Notice readAll() {
        return notificationService.markAll(currentUserService.require());
    }
}
