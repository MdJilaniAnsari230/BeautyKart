package com.business.services;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.business.entities.Admin;
import com.business.exception.ConflictException;
import com.business.repositories.AdminRepository;

@Service
public class AdminService {

    private final AdminRepository adminRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    @Autowired
    public AdminService(AdminRepository adminRepository,
                        BCryptPasswordEncoder passwordEncoder) {
        this.adminRepository = adminRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public List<Admin> getAll() {
        return (List<Admin>) adminRepository.findAll();
    }

    public Admin getAdmin(int id) {
        return adminRepository.findById(id).orElse(null);
    }

    public Admin findByEmail(String email) {
        return email == null ? null : adminRepository.findByAdminEmail(email.trim());
    }

    @Transactional
    public void updateAdmin(Admin form, int id) {
        Admin existing = adminRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Admin not found."));

        if (form.getAdminName() != null && !form.getAdminName().isBlank()) {
            existing.setAdminName(form.getAdminName().trim());
        }
        if (form.getAdminEmail() != null && !form.getAdminEmail().isBlank()) {
            String email = form.getAdminEmail().trim();
            Admin other = adminRepository.findByAdminEmail(email);
            if (other != null && other.getAdminId() != id) {
                throw new ConflictException("An admin with this email already exists.");
            }
            existing.setAdminEmail(email);
        }
        if (form.getAdminNumber() != null) {
            existing.setAdminNumber(form.getAdminNumber().trim());
        }
        if (form.getAdminPassword() != null && !form.getAdminPassword().isBlank()) {
            checkPassword(form.getAdminPassword());
            existing.setAdminPassword(passwordEncoder.encode(form.getAdminPassword()));
        }
        adminRepository.save(existing);
    }

    /** Refuses to delete the last remaining admin (would lock everyone out). */
    @Transactional
    public void delete(int id) {
        if (adminRepository.count() <= 1) {
            throw new ConflictException("The last remaining admin cannot be deleted.");
        }
        adminRepository.deleteById(id);
    }

    @Transactional
    public void addAdmin(Admin input) {
        if (input.getAdminName() == null || input.getAdminName().isBlank()) {
            throw new IllegalArgumentException("Admin name is required.");
        }
        if (input.getAdminEmail() == null || input.getAdminEmail().isBlank()) {
            throw new IllegalArgumentException("Admin email is required.");
        }
        checkPassword(input.getAdminPassword());

        String email = input.getAdminEmail().trim();
        if (adminRepository.findByAdminEmail(email) != null) {
            throw new ConflictException("An admin with this email already exists.");
        }

        Admin admin = new Admin();   // new entity: client cannot choose the id
        admin.setAdminName(input.getAdminName().trim());
        admin.setAdminEmail(email);
        admin.setAdminNumber(input.getAdminNumber() == null ? null : input.getAdminNumber().trim());
        admin.setAdminPassword(passwordEncoder.encode(input.getAdminPassword()));
        adminRepository.save(admin);
    }

    public boolean validateAdminCredentials(String email, String password) {
        return authenticate(email, password) != null;
    }

    /** Returns the admin when credentials are valid, otherwise null. */
    public Admin authenticate(String email, String password) {
        if (email == null || password == null) {
            return null;
        }
        Admin admin = adminRepository.findByAdminEmail(email.trim());
        if (admin != null && admin.getAdminPassword() != null
                && passwordEncoder.matches(password, admin.getAdminPassword())) {
            return admin;
        }
        return null;
    }

    private void checkPassword(String password) {
        if (password == null || password.length() < 8 || password.length() > 72) {
            throw new IllegalArgumentException("Admin password must contain 8 to 72 characters.");
        }
    }
}
