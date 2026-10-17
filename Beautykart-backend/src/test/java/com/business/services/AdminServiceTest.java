package com.business.services;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import com.business.entities.Admin;
import com.business.exception.ConflictException;
import com.business.repositories.AdminRepository;

@ExtendWith(MockitoExtension.class)
class AdminServiceTest {

    @Mock
    private AdminRepository adminRepository;

    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
    private AdminService service;

    @BeforeEach
    void setUp() {
        service = new AdminService(adminRepository, encoder);
    }

    @Test
    void authenticate_acceptsOnlyCorrectPassword() {
        Admin admin = new Admin();
        admin.setAdminEmail("boss@example.com");
        admin.setAdminPassword(encoder.encode("correct-horse"));
        when(adminRepository.findByAdminEmail("boss@example.com")).thenReturn(admin);

        assertNotNull(service.authenticate("boss@example.com", "correct-horse"));
        assertNull(service.authenticate("boss@example.com", "nope"));
    }

    @Test
    void delete_refusesToRemoveLastAdmin() {
        when(adminRepository.count()).thenReturn(1L);

        assertThrows(ConflictException.class, () -> service.delete(1));
        verify(adminRepository, never()).deleteById(1);
    }

    @Test
    void addAdmin_rejectsDuplicateEmail() {
        Admin existing = new Admin();
        when(adminRepository.findByAdminEmail("boss@example.com")).thenReturn(existing);

        Admin input = new Admin();
        input.setAdminName("Boss");
        input.setAdminEmail("boss@example.com");
        input.setAdminPassword("longenough1");

        assertThrows(ConflictException.class, () -> service.addAdmin(input));
    }
}
