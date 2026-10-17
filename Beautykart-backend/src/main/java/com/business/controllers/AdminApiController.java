
package com.business.controllers;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;


import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.business.entities.Admin;
import com.business.services.AdminService;

@RestController
@RequestMapping("/api/admin/admins")
public class AdminApiController {

    private final AdminService adminService;

    public AdminApiController(AdminService adminService) {
        this.adminService = adminService;
    }

    // Return admin data without password
    private Map<String, Object> toAdminResponse(Admin admin) {
        Map<String, Object> data = new LinkedHashMap<>();

        data.put("adminId", admin.getAdminId());
        data.put("adminName", admin.getAdminName());
        data.put("adminEmail", admin.getAdminEmail());
        data.put("adminNumber", admin.getAdminNumber());

        return data;
    }

    // GET: Get all admins
    @GetMapping
    public ResponseEntity<?> getAllAdmins() {

        List<Map<String, Object>> admins = adminService.getAll()
            .stream()
            .map(this::toAdminResponse)
            .collect(Collectors.toList());

        return ResponseEntity.ok(admins);
    }

    // GET: Get one admin by ID
    @GetMapping("/{id}")
    public ResponseEntity<?> getAdmin(
            @PathVariable int id) {

        Admin admin = adminService.getAdmin(id);

        if (admin == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("message", "Admin not found."));
        }

        return ResponseEntity.ok(toAdminResponse(admin));
    }

    // POST: Add an admin
    @PostMapping
    public ResponseEntity<?> addAdmin(
            @RequestBody Admin admin) {

        try {
            adminService.addAdmin(admin);

            return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("message", "Admin added successfully."));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(Map.of("message", e.getMessage()));
        }
    }

    // PUT: Update an admin
    @PutMapping("/{id}")
    public ResponseEntity<?> updateAdmin(
            @PathVariable int id,
            @RequestBody Admin admin) {

        Admin existingAdmin = adminService.getAdmin(id);

        if (existingAdmin == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("message", "Admin not found."));
        }

        adminService.updateAdmin(admin, id);

        return ResponseEntity.ok(
            Map.of("message", "Admin updated successfully.")
        );
    }

    // DELETE: Delete an admin
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteAdmin(
            @PathVariable int id,
            jakarta.servlet.http.HttpServletRequest request) {

        Object self = request.getSession().getAttribute("adminId");
        if (self instanceof Number && ((Number) self).intValue() == id) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Map.of("message", "You cannot delete your own admin account."));
        }

        Admin existingAdmin = adminService.getAdmin(id);

        if (existingAdmin == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("message", "Admin not found."));
        }

        adminService.delete(id);

        return ResponseEntity.ok(
            Map.of("message", "Admin deleted successfully.")
        );
    }
}
