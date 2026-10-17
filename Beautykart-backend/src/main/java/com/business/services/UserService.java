package com.business.services;

import java.util.List;
import java.util.Optional;
import java.util.regex.Pattern;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.business.dto.SignupRequest;
import com.business.entities.User;
import com.business.exception.ConflictException;
import com.business.repositories.UserRepository;

@Service
public class UserService {

    private static final Pattern EMAIL =
            Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");
    private static final Pattern MOBILE = Pattern.compile("[6-9][0-9]{9}");

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository,
                       BCryptPasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Creates a NEW user from whitelisted fields only. A brand-new entity is always
     * built here, so a client can never supply an existing userId and overwrite
     * another account.
     */
    @Transactional
    public User registerUser(SignupRequest request) {
        String email = normalizeEmail(request.getUserEmail());
        String name = request.getUserName() == null ? "" : request.getUserName().trim();
        String password = request.getUserPassword();
        Long number = request.getUserNumber();

        if (name.isEmpty() || name.length() > 100) {
            throw new IllegalArgumentException("Name is required (max 100 characters).");
        }
        if (email.isEmpty() || email.length() > 150 || !EMAIL.matcher(email).matches()) {
            throw new IllegalArgumentException("A valid email is required.");
        }
        if (password == null || password.length() < 8 || password.length() > 72) {
            // 72 = BCrypt's effective maximum
            throw new IllegalArgumentException("Password must contain 8 to 72 characters.");
        }
        if (number == null || !MOBILE.matcher(String.valueOf(number)).matches()) {
            throw new IllegalArgumentException("Please enter a valid 10-digit mobile number.");
        }
        if (userRepository.existsByUserEmail(email)) {
            throw new ConflictException("An account with this email already exists.");
        }
        if (userRepository.existsByUserNumber(number)) {
            throw new ConflictException("An account with this phone number already exists.");
        }

        User user = new User();
        user.setUserName(name);
        user.setUserEmail(email);
        user.setUserNumber(number);
        user.setUserPassword(passwordEncoder.encode(password));
        return userRepository.save(user);
    }

    public User authenticate(String email, String rawPassword) {
        if (email == null || rawPassword == null) {
            return null;
        }
        Optional<User> optional = userRepository.findByUserEmail(normalizeEmail(email));
        if (optional.isEmpty()) {
            return null;
        }
        User user = optional.get();
        if (user.getUserPassword() == null
                || !passwordEncoder.matches(rawPassword, user.getUserPassword())) {
            return null;
        }
        return user;
    }

    public User getUserByEmail(String email) {
        return userRepository.findByUserEmail(normalizeEmail(email)).orElse(null);
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }

    public List<User> getAllUser() {
        return (List<User>) userRepository.findAll();
    }

    public User getUser(int id) {
        return userRepository.findById(id).orElse(null);
    }

    /**
     * Admin edit: only name, email and phone are changed. The password hash and
     * profile image are always preserved (previously the whole row was overwritten,
     * storing a missing/plaintext password).
     */
    @Transactional
    public void updateUser(User form, int id) {
        User existing = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found."));

        if (form.getUserName() != null && !form.getUserName().isBlank()) {
            existing.setUserName(form.getUserName().trim());
        }
        if (form.getUserEmail() != null && !form.getUserEmail().isBlank()) {
            String email = normalizeEmail(form.getUserEmail());
            if (!EMAIL.matcher(email).matches()) {
                throw new IllegalArgumentException("A valid email is required.");
            }
            if (!email.equals(existing.getUserEmail()) && userRepository.existsByUserEmail(email)) {
                throw new ConflictException("An account with this email already exists.");
            }
            existing.setUserEmail(email);
        }
        if (form.getUserNumber() != null) {
            if (!MOBILE.matcher(String.valueOf(form.getUserNumber())).matches()) {
                throw new IllegalArgumentException("Please enter a valid 10-digit mobile number.");
            }
            if (!form.getUserNumber().equals(existing.getUserNumber())
                    && userRepository.existsByUserNumber(form.getUserNumber())) {
                throw new ConflictException("An account with this phone number already exists.");
            }
            existing.setUserNumber(form.getUserNumber());
        }
        userRepository.save(existing);
    }

    public void deleteUser(int id) {
        userRepository.deleteById(id);
    }

    /** Admin console "add user" form. */
    public void addUser(User form) {
        SignupRequest request = new SignupRequest();
        request.setUserName(form.getUserName());
        request.setUserEmail(form.getUserEmail());
        request.setUserNumber(form.getUserNumber());
        request.setUserPassword(form.getUserPassword());
        registerUser(request);
    }

    @Transactional
    public User updateProfileImage(int userId, String imagePath) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found."));
        user.setProfileImagePath(imagePath);
        return userRepository.save(user);
    }
}
