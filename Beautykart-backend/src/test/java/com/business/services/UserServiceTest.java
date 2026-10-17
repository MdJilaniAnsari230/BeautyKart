package com.business.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import com.business.dto.SignupRequest;
import com.business.entities.User;
import com.business.exception.ConflictException;
import com.business.repositories.UserRepository;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
    private UserService service;

    @BeforeEach
    void setUp() {
        service = new UserService(userRepository, encoder);
    }

    private SignupRequest validRequest() {
        SignupRequest r = new SignupRequest();
        r.setUserName("  Asha  ");
        r.setUserEmail("  Asha@Example.COM ");
        r.setUserNumber(9876543210L);
        r.setUserPassword("secret123");
        return r;
    }

    @Test
    void register_hashesPasswordNormalisesEmailAndCreatesNewEntity() {
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

        service.registerUser(validRequest());

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        User saved = captor.getValue();

        assertEquals(0, saved.getUserId(), "id must never come from the client");
        assertEquals("asha@example.com", saved.getUserEmail());
        assertEquals("Asha", saved.getUserName());
        assertNotEquals("secret123", saved.getUserPassword());
        assertTrue(encoder.matches("secret123", saved.getUserPassword()));
    }

    @Test
    void register_duplicateEmail_isConflict() {
        when(userRepository.existsByUserEmail("asha@example.com")).thenReturn(true);

        assertThrows(ConflictException.class, () -> service.registerUser(validRequest()));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void register_duplicatePhone_isConflict() {
        when(userRepository.existsByUserNumber(9876543210L)).thenReturn(true);

        assertThrows(ConflictException.class, () -> service.registerUser(validRequest()));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void register_invalidInput_isRejected() {
        SignupRequest badPhone = validRequest();
        badPhone.setUserNumber(1234567890L);
        assertThrows(IllegalArgumentException.class, () -> service.registerUser(badPhone));

        SignupRequest shortPassword = validRequest();
        shortPassword.setUserPassword("short");
        assertThrows(IllegalArgumentException.class, () -> service.registerUser(shortPassword));

        SignupRequest badEmail = validRequest();
        badEmail.setUserEmail("not-an-email");
        assertThrows(IllegalArgumentException.class, () -> service.registerUser(badEmail));
    }

    @Test
    void authenticate_checksPassword() {
        User stored = new User();
        stored.setUserEmail("asha@example.com");
        stored.setUserPassword(encoder.encode("secret123"));
        when(userRepository.findByUserEmail("asha@example.com")).thenReturn(Optional.of(stored));

        assertNotNull(service.authenticate("Asha@Example.com", "secret123"));
        assertNull(service.authenticate("asha@example.com", "wrong-password"));
    }

    @Test
    void updateUser_keepsPasswordHashAndImage() {
        User existing = new User();
        existing.setUserName("Old");
        existing.setUserEmail("old@example.com");
        existing.setUserPassword("HASH");
        existing.setProfileImagePath("/uploads/profile-images/x.jpg");
        when(userRepository.findById(5)).thenReturn(Optional.of(existing));

        User form = new User();           // admin form: no password, no image
        form.setUserName("New Name");

        service.updateUser(form, 5);

        assertEquals("New Name", existing.getUserName());
        assertEquals("HASH", existing.getUserPassword());
        assertEquals("/uploads/profile-images/x.jpg", existing.getProfileImagePath());
    }
}
